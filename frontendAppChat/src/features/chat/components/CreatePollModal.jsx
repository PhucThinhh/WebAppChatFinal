import { useState } from "react";
import { toast } from "react-toastify";
import { createPollApi } from "../api/chatApi";

function CreatePollModal({ roomId, onClose, onCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [allowAddOption, setAllowAddOption] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [hideResultUntilVoted, setHideResultUntilVoted] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const validOptions = options.map((item) => item.trim()).filter(Boolean);
  const canSubmit = question.trim() && validOptions.length >= 2;

  const handleChangeOption = (index, value) => {
    setOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleAddOption = () => {
    if (options.length >= 10) {
      toast.warning("Chỉ nên tạo tối đa 10 lựa chọn");
      return;
    }

    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;

    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePoll = async () => {
    if (!roomId) return;

    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi bình chọn");
      return;
    }

    if (validOptions.length < 2) {
      toast.error("Bình chọn phải có ít nhất 2 lựa chọn");
      return;
    }

    try {
      setSubmitting(true);

      await createPollApi({
        roomId,
        question: question.trim(),
        options: validOptions,
        multipleChoice,
        allowAddOption,
        anonymous,
        hideResultUntilVoted,
        pinned,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      toast.success("Đã tạo bình chọn");
      onCreated?.();
      onClose?.();
    } catch (error) {
      console.error("Tạo bình chọn lỗi:", error);
      toast.error(error?.response?.data || "Tạo bình chọn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1300]">
      <div className="w-[560px] max-h-[90vh] bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
          <h3 className="text-lg font-semibold">Tạo bình chọn</h3>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-2xl text-slate-600"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(90vh-136px)] overflow-y-auto p-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Chủ đề bình chọn
          </label>

          <div className="relative mb-5">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
              placeholder="Đặt câu hỏi bình chọn"
              className="w-full h-28 resize-none px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500 text-slate-900"
            />

            <div className="absolute right-3 bottom-3 text-xs text-slate-400">
              {question.length}/200
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Các lựa chọn
          </label>

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(e) => handleChangeOption(index, e.target.value)}
                  placeholder={`Lựa chọn ${index + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-blue-500"
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="w-9 h-9 rounded-full hover:bg-red-50 text-red-500"
                    title="Xoá lựa chọn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            className="mt-3 text-blue-600 font-semibold hover:text-blue-700"
          >
            + Thêm lựa chọn
          </button>

          <div className="h-px bg-slate-200 my-5" />

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-2 font-semibold text-slate-800"
          >
            ⚙️ Thiết lập nâng cao
            <span className="text-slate-400">{showAdvanced ? "▲" : "▼"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Thời hạn bình chọn
                </label>

                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-blue-500"
                />
              </div>

              <SettingRow
                title="Ghim lên đầu trò chuyện"
                desc="Bình chọn sẽ hiển thị trên thanh ghim"
                checked={pinned}
                onChange={setPinned}
              />

              <SettingRow
                title="Chọn nhiều phương án"
                desc="Người dùng có thể chọn nhiều lựa chọn"
                checked={multipleChoice}
                onChange={setMultipleChoice}
              />

              <SettingRow
                title="Có thể thêm phương án"
                desc="Thành viên có thể thêm lựa chọn mới"
                checked={allowAddOption}
                onChange={setAllowAddOption}
              />

              <SettingRow
                title="Ẩn kết quả khi chưa bình chọn"
                desc="Chỉ thấy kết quả sau khi đã vote"
                checked={hideResultUntilVoted}
                onChange={setHideResultUntilVoted}
              />

              <SettingRow
                title="Ẩn người bình chọn"
                desc="Không hiển thị danh sách ai đã vote"
                checked={anonymous}
                onChange={setAnonymous}
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="h-20 px-5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"
            onClick={() => setShowAdvanced((prev) => !prev)}
            title="Thiết lập nâng cao"
          >
            ⚙️
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
            >
              Huỷ
            </button>

            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={handleCreatePoll}
              className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang tạo..." : "Tạo bình chọn"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ title, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full p-1 transition ${
          checked ? "bg-blue-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default CreatePollModal;
