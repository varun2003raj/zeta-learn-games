import constructionImage from "../assets/under-construction.svg";
import "./UnderConstruction.css";

export default function UnderConstruction({
  title = "Page Under Construction",
  subtitle = "This page is being built. Please check back soon.",
}) {
  return (
    <div className="under-construction-page">
      <div className="under-construction-card">
        <img
          src={constructionImage}
          alt="Under construction"
          className="under-construction-image"
        />
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
