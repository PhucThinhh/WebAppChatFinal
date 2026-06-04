import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  addPollOptionApi,
  closePollApi,
  getPollApi,
  votePollApi,
} from "../api/chatApi";

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%231e293b"/><circle cx="32" cy="24" r="12" fill="%23e2e8f0"/><path d="M12 56c4-12 14-18 20-18s16 6 20 18" fill="%23e2e8f0"/></svg>';

function PollMessageCard({ pollId, currentUserId, pollRealtime }) {
  const [poll, setPoll] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [showAddOption, setShowAddOption] = useState(false);
  const [expandedOptionId, setExpandedOptionId] = useState(null);

  const toBool = (value) => {
    if (value === true) return true;
    if (value === false) return false;

    if (value === 1) return true;
    if (value === 0) return false;

    if (typeof value === "string") {
      const v = value.trim().toLowerCase();

      if (v === "true") return true;
      if (v === "false") return false;
      if (v === "1") return true;
      if (v === "0") return false;
    }

    return false;
  };

  const resolvePollAvatar = (avatar) => {
    if (!avatar) return DEFAULT_AVATAR;

    const value = String(avatar);

    if (value.startsWith("data:image")) return value;
    if (value.startsWith("http")) return value;

    return `http://localhost:8080${value}`;
  };

  const getVoterName = (voter, index) => {
    if (typeof voter === "string") return voter;

    return (
      voter?.username ||
      voter?.name ||
      voter?.fullName ||
      voter?.displayName ||
      `Người dùng ${index + 1}`
    );
  };

  const getVoterId = (voter, index) => {
    if (typeof voter === "string") return `${voter}_${index}`;

    return voter?.id || voter?.userId || voter?._id || index;
  };

  const normalizePoll = (data) => {
    if (!data) return null;

    return {
      ...data,
      options: Array.isArray(data.options) ? data.options : [],
    };
  };

  const syncSelectedOptions = useCallback((pollData) => {
    const votedIds = Array.isArray(pollData?.options)
      ? pollData.options
          .filter((option) => toBool(option.votedByMe))
          .map((option) => option.id)
      : [];

    setSelectedOptionIds(votedIds);
  }, []);

  const loadPollFromServer = useCallback(async () => {
    if (!pollId) return;

    try {
      const res = await getPollApi(pollId);
      const pollData = normalizePoll(res.data);

      setPoll(pollData);
      syncSelectedOptions(pollData);
    } catch (error) {
      console.error("Load poll lỗi:", error);
    }
  }, [pollId, syncSelectedOptions]);

  useEffect(() => {
    loadPollFromServer();
  }, [loadPollFromServer]);

  useEffect(() => {
    if (!pollRealtime?.id || String(pollRealtime.id) !== String(pollId)) return;

    /*
      Không setPoll(pollRealtime) trực tiếp.

      Lý do:
      pollRealtime là dữ liệu theo người vừa thao tác.
      Ví dụ A vote xong, backend bắn dữ liệu của A cho cả room.
      Nếu B lấy thẳng dữ liệu đó thì B sẽ thấy kết quả dù B chưa vote.

      Vì vậy mỗi tài khoản phải gọi lại getPollApi(pollId)
      để backend trả đúng dữ liệu theo chính user hiện tại.
    */
    loadPollFromServer();
  }, [pollRealtime, pollId, loadPollFromServer]);

  const totalVotes = Number(poll?.totalVotes || 0);

  const hasVoted = useMemo(() => {
    if (toBool(poll?.votedByMe)) return true;

    if (!Array.isArray(poll?.options)) return false;

    return poll.options.some((option) => toBool(option.votedByMe));
  }, [poll]);

  const hideResultUntilVoted = toBool(poll?.hideResultUntilVoted);

  const canShowResult = !hideResultUntilVoted || hasVoted;

  const hideVoters = toBool(poll?.anonymous);

  const canShowVoters = canShowResult && !hideVoters;

  const expired = useMemo(() => {
    if (!poll?.expiresAt) return false;
    return new Date(poll.expiresAt).getTime() < Date.now();
  }, [poll?.expiresAt]);

  const disabled = !poll || poll.closed || expired;

  const toggleOption = (optionId) => {
    if (disabled) return;

    setSelectedOptionIds((prev) => {
      if (poll?.multipleChoice) {
        return prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];
      }

      return prev.includes(optionId) ? [] : [optionId];
    });
  };

  const handleVote = async () => {
    if (!pollId || selectedOptionIds.length === 0) return;

    try {
      setLoading(true);

      await votePollApi(pollId, selectedOptionIds);

      await loadPollFromServer();

      toast.success("Đã bình chọn");
    } catch (error) {
      console.error("Vote lỗi:", error);
      toast.error(error?.response?.data || "Bình chọn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async () => {
    const text = newOptionText.trim();

    if (!text || !pollId) return;

    try {
      setLoading(true);

      await addPollOptionApi(pollId, text);

      await loadPollFromServer();

      setNewOptionText("");
      setShowAddOption(false);

      toast.success("Đã thêm lựa chọn");
    } catch (error) {
      console.error("Thêm lựa chọn lỗi:", error);
      toast.error(error?.response?.data || "Thêm lựa chọn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async () => {
    if (!pollId) return;

    try {
      setLoading(true);

      await closePollApi(pollId);

      await loadPollFromServer();

      toast.success("Đã đóng bình chọn");
    } catch (error) {
      console.error("Đóng poll lỗi:", error);
      toast.error(error?.response?.data || "Đóng bình chọn thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!poll) {
    return (
      <div className="w-[340px] rounded-2xl bg-white text-slate-900 p-4 shadow">
        <div className="text-sm text-slate-500">Đang tải bình chọn...</div>
      </div>
    );
  }

  return (
    <div className="w-[360px] rounded-2xl bg-white text-slate-900 shadow-lg overflow-hidden border border-slate-200">
      <div className="p-4">
        <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-3">
          <span>📊</span>
          <span>Bình chọn</span>
        </div>

        <h4 className="font-semibold text-slate-900 text-base break-words">
          {poll.question}
        </h4>

        <div className="text-xs text-slate-500 mt-1">
          {poll.multipleChoice ? "Chọn nhiều phương án" : "Chọn một phương án"}
          {poll.closed ? " · Đã đóng" : ""}
          {expired ? " · Đã hết hạn" : ""}
        </div>

        {hideResultUntilVoted && !hasVoted && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-100 text-xs text-slate-500">
            Kết quả sẽ hiển thị sau khi bạn bình chọn
          </div>
        )}

        {hideVoters && canShowResult && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-slate-100 text-xs text-slate-500">
            Người bình chọn đã được ẩn
          </div>
        )}

        <div className="mt-4 space-y-3">
          {poll.options?.map((option) => {
            const voteCount = Number(option.voteCount || 0);

            const percent =
              canShowResult && totalVotes > 0
                ? Math.round((voteCount / totalVotes) * 100)
                : 0;

            const selected = selectedOptionIds.includes(option.id);

            const voters = Array.isArray(option.voters) ? option.voters : [];

            const isExpanded = expandedOptionId === option.id;

            return (
              <div key={option.id} className="space-y-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleOption(option.id)}
                  className={`w-full relative rounded-xl border overflow-hidden text-left transition ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  } ${disabled ? "cursor-default" : "cursor-pointer"}`}
                >
                  {canShowResult && (
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-200/60"
                      style={{ width: `${percent}%` }}
                    />
                  )}

                  <div className="relative z-10 px-3 py-2.5 flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        selected
                          ? "bg-blue-500 text-white"
                          : "bg-white border border-slate-300"
                      }`}
                    >
                      {selected ? "✓" : ""}
                    </span>

                    <span className="flex-1 text-sm font-medium text-slate-800 break-words">
                      {option.text}
                    </span>

                    {canShowResult ? (
                      <span className="text-sm text-slate-600">
                        {voteCount}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Ẩn</span>
                    )}
                  </div>
                </button>

                {canShowVoters && voteCount > 0 && (
                  <div className="px-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOptionId(isExpanded ? null : option.id)
                      }
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      {isExpanded
                        ? "Ẩn người bình chọn"
                        : "Xem người bình chọn"}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                        {voters.length > 0 ? (
                          voters.map((voter, index) => {
                            const voterName = getVoterName(voter, index);
                            const voterAvatar =
                              typeof voter === "object" ? voter.avatar : null;

                            return (
                              <div
                                key={getVoterId(voter, index)}
                                className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 border-slate-200"
                              >
                                <img
                                  src={resolvePollAvatar(voterAvatar)}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover bg-slate-200"
                                  onError={(e) => {
                                    e.currentTarget.src = DEFAULT_AVATAR;
                                  }}
                                />

                                <span className="text-sm text-slate-700 truncate">
                                  {voterName}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-500">
                            Chưa có dữ liệu người bình chọn
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {hideVoters && canShowResult && voteCount > 0 && (
                  <div className="px-2 text-xs text-slate-400">
                    Người bình chọn đã được ẩn
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-sm font-medium">
          {canShowResult ? (
            <span className="text-blue-600">{totalVotes} lượt bình chọn</span>
          ) : (
            <span className="text-slate-500">
              Kết quả sẽ hiển thị sau khi bạn bình chọn
            </span>
          )}
        </div>

        {poll.allowAddOption && !disabled && (
          <div className="mt-3">
            {showAddOption ? (
              <div className="flex gap-2">
                <input
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  placeholder="Nhập lựa chọn mới"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-blue-500 text-sm"
                />

                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!newOptionText.trim() || loading}
                  className="px-3 py-2 rounded-lg bg-blue-500 text-white text-sm disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddOption(true)}
                className="text-blue-600 text-sm font-semibold"
              >
                + Thêm lựa chọn
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled || selectedOptionIds.length === 0 || loading}
          onClick={handleVote}
          className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang xử lý..." : "Xác nhận"}
        </button>

        {Number(poll.createdBy) === Number(currentUserId) && !poll.closed && (
          <button
            type="button"
            onClick={handleClosePoll}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300"
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}

export default PollMessageCard;
