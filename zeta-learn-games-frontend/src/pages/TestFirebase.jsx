import { addDoc, collection } from "firebase/firestore";
import { db } from "../Firebase/firebase";

export default function FirebaseTest() {
  const testWrite = async () => {
    try {
      await addDoc(collection(db, "notifications"), {
        title: "Admin Connected",
        message: "Firebase connection successful",
        type: "test",
        createdAt: new Date()
      });
      alert("Data added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error — check console");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <button onClick={testWrite}>Test Firebase Connection</button>
    </div>
  );
}
