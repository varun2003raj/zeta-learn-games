from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from teams.models import Team, TeamMember, TeamSolvedChallenge
from challenges.models import CTFControl


def is_admin(user):
    return (
        user.is_superuser
        or user.is_staff
        or getattr(user, "is_admin_user", False)
        or getattr(user, "role", None) == "admin"
    )


def ensure_access(request):
    control = CTFControl.get_solo()
    if control.status not in (CTFControl.STATUS_RUNNING, CTFControl.STATUS_FINISHED):
        return Response({"error": "CTF is not active right now"}, status=status.HTTP_403_FORBIDDEN)
    if not TeamMember.objects.filter(user=request.user).exists():
        return Response({"error": "Create or join a team to access content"}, status=status.HTTP_403_FORBIDDEN)
    return None


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        access_error = ensure_access(request)
        if access_error:
            return access_error
        teams = Team.objects.all().order_by("-score")

        data = []
        rank = 1

        for team in teams:
            members = TeamMember.objects.filter(team=team)

            members_data = []
            for m in members:
                members_data.append({
                    "username": m.user.username,
                    "joined_at": m.joined_at
                })

            data.append({
                "rank": rank,
                "team_name": team.name,
                "team_code": team.code,
                "score": team.score,
                "leader": team.leader.username,
                "members": members_data
            })

            rank += 1

        return Response(data)


class LeaderboardTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        access_error = ensure_access(request)
        if access_error:
            return access_error

        teams = list(Team.objects.all().order_by("-score"))
        solves = list(
            TeamSolvedChallenge.objects.select_related("team", "challenge")
            .order_by("solved_at", "id")
        )

        all_times = [s.solved_at for s in solves if s.solved_at]
        control = CTFControl.get_solo()
        start_time = control.started_at or (all_times[0] if all_times else None)
        end_time = control.finished_at or (all_times[-1] if all_times else None)

        def color_for_index(idx):
            # Golden-angle hue spacing gives visually distinct colors for many teams.
            hue = (idx * 137.508) % 360
            return f"hsl({hue:.1f}, 82%, 58%)"

        running = {t.id: 0 for t in teams}
        series = {
            t.id: {
                "team_name": t.name,
                "leader": t.leader.username,
                "color": color_for_index(idx),
                "points": [],
            }
            for idx, t in enumerate(teams)
        }

        if start_time:
            for t in teams:
                series[t.id]["points"].append({"time": start_time.isoformat(), "score": 0})

        for row in solves:
            team_id = row.team_id
            if team_id not in series:
                continue
            running[team_id] += int(row.challenge.points or 0)
            series[team_id]["points"].append(
                {"time": row.solved_at.isoformat(), "score": running[team_id]}
            )

        if end_time:
            for t in teams:
                pts = series[t.id]["points"]
                if not pts:
                    pts.append({"time": end_time.isoformat(), "score": 0})
                elif pts[-1]["time"] != end_time.isoformat():
                    pts.append({"time": end_time.isoformat(), "score": pts[-1]["score"]})

        return Response(
            {
                "time_start": start_time.isoformat() if start_time else None,
                "time_end": end_time.isoformat() if end_time else None,
                "max_score": max([t.score for t in teams], default=0),
                "series": list(series.values()),
            }
        )


class AdminLeaderboardTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view timeline!"}, status=status.HTTP_403_FORBIDDEN)

        teams = list(Team.objects.all().order_by("-score"))
        solves = list(
            TeamSolvedChallenge.objects.select_related("team", "challenge")
            .order_by("solved_at", "id")
        )
        all_times = [s.solved_at for s in solves if s.solved_at]
        control = CTFControl.get_solo()
        start_time = control.started_at or (all_times[0] if all_times else None)
        end_time = control.finished_at or (all_times[-1] if all_times else None)

        def color_for_index(idx):
            hue = (idx * 137.508) % 360
            return f"hsl({hue:.1f}, 82%, 58%)"

        running = {t.id: 0 for t in teams}
        series = {
            t.id: {
                "team_name": t.name,
                "leader": t.leader.username,
                "color": color_for_index(idx),
                "points": [],
            }
            for idx, t in enumerate(teams)
        }

        if start_time:
            for t in teams:
                series[t.id]["points"].append({"time": start_time.isoformat(), "score": 0})

        for row in solves:
            team_id = row.team_id
            if team_id not in series:
                continue
            running[team_id] += int(row.challenge.points or 0)
            series[team_id]["points"].append(
                {"time": row.solved_at.isoformat(), "score": running[team_id]}
            )

        if end_time:
            for t in teams:
                pts = series[t.id]["points"]
                if not pts:
                    pts.append({"time": end_time.isoformat(), "score": 0})
                elif pts[-1]["time"] != end_time.isoformat():
                    pts.append({"time": end_time.isoformat(), "score": pts[-1]["score"]})

        return Response(
            {
                "time_start": start_time.isoformat() if start_time else None,
                "time_end": end_time.isoformat() if end_time else None,
                "max_score": max([t.score for t in teams], default=0),
                "series": list(series.values()),
            }
        )
