import { useParams, useNavigate } from "react-router-dom";

function PdfView() {
  const { pdfUrl } = useParams();
  const navigate = useNavigate();

  const decodedUrl = decodeURIComponent(pdfUrl);
  const previewUrl = convertToPreviewUrl(decodedUrl);

  return (
    <div style={styles.wrapper}>
      <button style={styles.closeBtn} onClick={() => navigate(-1)}>
        ✕
      </button>

 
      <iframe
        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        title="PDF Viewer"
        style={styles.iframe}
        scrolling="yes"
      />
    </div>
  );
}


const convertToPreviewUrl = (url) => {
  if (url.includes("/preview")) return url;

  const match = url.match(/id=([^&]+)/);
  if (!match) return url;

  return `https://drive.google.com/file/d/${match[1]}/preview`;
};

export default PdfView;


const styles = {
  wrapper: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(860px 500px at -8% -20%, rgba(59,130,246,0.12), transparent 60%), linear-gradient(160deg,#f6f9ff 0%,#eef4ff 55%,#f9fcff 100%)",
    overflow: "hidden",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    overflow: "auto",
  },
  closeBtn: {
    position: "fixed",
    top: "14px",
    right: "18px",
    zIndex: 1000,
    background: "#ffffff",
    color: "#10213a",
    border: "1px solid #d8e4f3",
    borderRadius: "10px",
    width: "38px",
    height: "38px",
    fontSize: "18px",
    cursor: "pointer",
  },
};
