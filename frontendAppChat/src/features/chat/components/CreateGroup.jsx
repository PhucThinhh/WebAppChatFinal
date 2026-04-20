import { useState } from "react";
import { createGroupApi } from "../api/chatApi";

function CreateGroup({ user, friends, onCreated }) {
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    console.log("TOKEN:", localStorage.getItem("token"));
    const res = await createGroupApi({
      name,
      creatorId: user.id,
      memberIds: selected,
    });

    onCreated(res.data); // 🔥 trả group về cho Chat
  };

  return (
    <div className="p-4 text-white">
      <input
        placeholder="Tên nhóm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 p-2 bg-slate-800 rounded"
      />

      {friends.map((f) => (
        <div key={f.id} onClick={() => toggle(f.id)}>
          <input type="checkbox" checked={selected.includes(f.id)} />
          {f.name}
        </div>
      ))}

      <button onClick={handleCreate}>Tạo nhóm</button>
    </div>
  );
}

export default CreateGroup;
