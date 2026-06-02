import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Phone, Video, ShieldCheck, Info, BellOff, Pin, UserPlus, Camera, Pencil } from "lucide-react";

import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import CreateGroup from "../components/CreateGroup";
import CallModal from "../components/CallModal";
import { getBackendUrl } from "../../../config/env";
import { DEFAULT_AVATAR_URL, getImageUrl } from "../../../utils/imageUrl";
import axiosClient from "../../../services/axiosClient";


import FriendsList from "../../friend/components/FriendsList";
import FriendRequests from "../../friend/components/FriendRequests";
import FriendSearch from "../../friend/components/FriendSearch";

import useChat from "../hooks/useChat";
import useUser from "../hooks/useUser";

import ProfileModal from "../../user/components/ProfileModal";
import ChangePasswordModal from "../../user/components/ChangePasswordModal";

import {
    disconnectSocket,
    joinRoom,
    leaveRoom,
    subscribeCallSignals,
    subscribeOnlineList,
} from "../socket/socket";

import {
    deleteConversationApi,
    blockUserApi,
    getBlockStatusApi,
    unblockUserApi,
    getMyGroupsApi,
    addMemberApi,
    getGroupMembersApi,
    removeMemberApi,
    deleteGroupApi,
    updateRoleApi,
    leaveGroupApi,
    renameGroupApi,
    updateGroupAvatarApi,
} from "../api/chatApi";
import { getFriendRequestsApi, getFriendsApi } from "../../friend/api/friendApi";

import {
    connectSocket,
    sendMessageSocket,
  subscribeGroupUpdates,
    subscribeUserStatus,
} from "../socket/socket";

import { getMessagesApi } from "../api/chatApi";

const DEFAULT_AVATAR = DEFAULT_AVATAR_URL;
const VIOLATION_MESSAGE = "Tin nhắn của bạn bị vi phạm tiêu chuẩn cộng đồng.";

function ChatPage() {
    const navigate = useNavigate();

    const { messages, setMessages, input, setInput, addMessage, messagesEndRef } =
      useChat();

    const { user, fetchUser } = useUser();

    const [activeTab, setActiveTab] = useState("chat");
    const [selectedUser, setSelectedUser] = useState(null);

    const [showProfile, setShowProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [callModal, setCallModal] = useState(null);

    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [friendRequestNotifications, setFriendRequestNotifications] = useState([]);

    const [showMenu, setShowMenu] = useState(false);
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [showConversationInfo, setShowConversationInfo] = useState(false);
    const [showGroupMenu, setShowGroupMenu] = useState(false);
    const [groupMemberCount, setGroupMemberCount] = useState(0);
    const [groupMembers, setGroupMembers] = useState([]);
    const [showViewMembersModal, setShowViewMembersModal] = useState(false);
    const [viewMembersList, setViewMembersList] = useState([]);
    const [viewMembersLoading, setViewMembersLoading] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
    const [showUpdateRoleModal, setShowUpdateRoleModal] = useState(false);
    const [friendCandidates, setFriendCandidates] = useState([]);
    const [memberCandidates, setMemberCandidates] = useState([]);
    const [roleCandidates, setRoleCandidates] = useState([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [selectedRoleUserId, setSelectedRoleUserId] = useState(null);
    const [selectedRoleValue, setSelectedRoleValue] = useState("MEMBER");

    const [forwardMessage, setForwardMessage] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);

    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isRemovedFromGroup, setIsRemovedFromGroup] = useState(false);

    const [blockStatus, setBlockStatus] = useState({
      blockedByMe: false,
      blockedByOther: false,
    });

    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [conversationSearch, setConversationSearch] = useState("");
    const [conversationFilter, setConversationFilter] = useState("all");
    const [mutedConversationIds, setMutedConversationIds] = useState(() => new Set());
    const [pinnedConversationIds, setPinnedConversationIds] = useState(() => new Set());

    const unreadNotificationCount = useMemo(
      () =>
        conversations.reduce(
          (total, conversation) => total + Number(conversation.unreadCount || 0),
          0
        ),
      [conversations]
    );

    const notificationCount =
      unreadNotificationCount + friendRequestNotifications.length;

    const isCurrentConversationMuted =
      selectedConversationId && mutedConversationIds.has(selectedConversationId);
    const isCurrentConversationPinned =
      selectedConversationId && pinnedConversationIds.has(selectedConversationId);

    const currentUserId = user?.id || user?._id;

    const conversationStorageKey = useMemo(() => {
      if (!currentUserId) return null;
      return `chat_conversations_${currentUserId}`;
    }, [currentUserId]);

    const resolveAvatar = (avatar) => {
      return getImageUrl(avatar, DEFAULT_AVATAR) || DEFAULT_AVATAR;
    };

    const showIncomingMessageNotification = (message, conversation) => {
      const title = conversation?.name || message?.senderName || "Tin nhắn mới";
      const body = summarizeLastMessage(message);
      const toastId = `incoming-${message?.id || message?._id || message?.createdAt || `${conversation?.id}-${Date.now()}`}`;

      toast.info(`${title}: ${body}`, {
        toastId,
        autoClose: 3500,
      });

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "granted" &&
        document.hidden
      ) {
        new window.Notification(title, {
          body,
          icon: getImageUrl(conversation?.avatar, DEFAULT_AVATAR) || DEFAULT_AVATAR,
        });
      }
    };

    useEffect(() => {
      if (typeof window === "undefined" || !("Notification" in window)) return;

      const requestNotificationPermission = () => {
        if (window.Notification.permission === "default") {
          window.Notification.requestPermission().catch(() => {});
        }
      };

      window.addEventListener("click", requestNotificationPermission, { once: true });

      return () => {
        window.removeEventListener("click", requestNotificationPermission);
      };
    }, []);

    const getFriendId = (friend) =>
      Number(friend?.userId ?? friend?.friendId ?? friend?.id);

    const getFriendName = (friend) =>
      friend?.username || friend?.name || `User ${getFriendId(friend)}`;

    const normalizeFriendUser = (friend) => {
      const id = getFriendId(friend);

      if (!id) return null;

      return {
        id,
        username: getFriendName(friend),
        avatar: friend?.avatar || friend?.friendAvatar || friend?.user?.avatar || null,
      };
    };

    const getMemberRole = (member) =>
      String(member?.role || "MEMBER").toUpperCase();

    const memberRoleLabel = (role) => {
      const r = String(role || "MEMBER").toUpperCase();
      if (r === "OWNER") return "Chủ nhóm";
      if (r === "ADMIN") return "Quản trị";
      return "Thành viên";
    };

    /** Backend GET /chat/group/members → GroupMemberDTO: userId, username, avatar, role */
    const enrichMemberFromDto = (m, friendById) => {
      const memberId = Number(m?.userId ?? m?.user_id ?? m?.id);
      if (!Number.isFinite(memberId) || memberId <= 0) return null;

      const friendInfo = friendById?.get?.(memberId);

      const nameFromDto = String(
        m?.username ?? m?.userName ?? m?.name ?? ""
      ).trim();

      const avatarRaw = m?.avatar ?? m?.Avatar;

      const avatarFromDto =
        avatarRaw && String(avatarRaw).trim() !== ""
          ? String(avatarRaw).trim()
          : null;

      const isMe = Number(memberId) === Number(currentUserId);


      return {
        id: memberId,
        userId: memberId,

        // 🔥 FIX QUAN TRỌNG
        username: isMe
          ? user?.username || "Bạn" // 👈 lấy từ useUser()
          : friendInfo?.username ||
            (nameFromDto && !/^User\s+\d+$/i.test(nameFromDto)
              ? nameFromDto
              : `User ${memberId}`),

        avatar: isMe
          ? user?.avatar || avatarFromDto
          : friendInfo?.avatar ?? avatarFromDto ?? null,

        role: getMemberRole(m),
      };
    };

    const upsertConversation = (conversation) => {
      setConversations((prev) => {
        const existed = prev.find((item) => item.id === conversation.id);

        if (existed) {
          return [
            { ...existed, ...conversation },
            ...prev.filter((item) => item.id !== conversation.id),
          ];
        }

        return [conversation, ...prev];
      });
    };

    const moveConversationToTop = (targetRoomId) => {
      if (!targetRoomId) return;

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.roomId === targetRoomId);
        if (index <= 0) return prev;

        const matched = prev[index];
        return [matched, ...prev.filter((_, i) => i !== index)];
      });
    };

    const toggleMuteCurrentConversation = () => {
      if (!selectedConversationId) return;

      setMutedConversationIds((prev) => {
        const next = new Set(prev);
        if (next.has(selectedConversationId)) {
          next.delete(selectedConversationId);
          toast.info("Đã bật thông báo hội thoại");
        } else {
          next.add(selectedConversationId);
          toast.info("Đã tắt thông báo hội thoại");
        }
        return next;
      });
    };

    const togglePinCurrentConversation = () => {
      if (!selectedConversationId) return;

      setPinnedConversationIds((prev) => {
        const next = new Set(prev);
        if (next.has(selectedConversationId)) {
          next.delete(selectedConversationId);
          toast.info("Đã bỏ ghim hội thoại");
        } else {
          next.add(selectedConversationId);
          toast.info("Đã ghim hội thoại");
        }
        return next;
      });

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.id === selectedConversationId);
        if (index <= 0) return prev;
        const next = [...prev];
        const [picked] = next.splice(index, 1);
        next.unshift(picked);
        return next;
      });
    };

    const openCreateGroupFromConversation = () => {
      setActiveTab("group");
      setShowConversationInfo(false);
      toast.info("Chọn thêm thành viên rồi tạo nhóm");
    };

    const handleForwardClick = (msg) => {
      setForwardMessage(msg);
      setShowForwardModal(true);
    };

    const handleForwardToTarget = (target) => {
      if (!forwardMessage) return;
      const isGroupTarget = target?.type === "GROUP";

      const newRoomId = isGroupTarget
        ? `group_${target.id}`
        : [Number(currentUserId), Number(target.id)]
            .sort((a, b) => a - b)
            .join("_");

      const msg = {
        senderId: Number(currentUserId),
        receiverId: isGroupTarget ? null : Number(target.id),
        roomId: newRoomId,
        content: forwardMessage.content,
        fileUrl: forwardMessage.fileUrl,
        type: forwardMessage.type === "FILE" ? "FILE" : "FORWARD",
        originalSenderId: forwardMessage.senderId,
        originalContent: forwardMessage.content,
        originalMessageId: forwardMessage.id,
      };

      sendMessageSocket(msg);
      setShowForwardModal(false);
      setForwardMessage(null);
    };

    const forwardableGroups = useMemo(() => {
      return conversations.filter((conversation) => {
        if (conversation.type !== "GROUP") return false;
        if (!selectedGroup?.id) return true;
        return String(conversation.targetGroup?.id) !== String(selectedGroup.id);
      });
    }, [conversations, selectedGroup]);

    const handleLeaveGroup = async () => {
      if (!selectedGroup?.id || !currentUserId) return;

      if (!window.confirm("Bạn có chắc muốn rời nhóm?")) return;

      try {
        await leaveGroupApi(selectedGroup.id, Number(currentUserId));

        // 🔥 xoá khỏi UI
        setConversations((prev) =>
          prev.filter((item) => item.id !== `group_${selectedGroup.id}`)
        );

        setSelectedGroup(null);
        setSelectedConversationId(null);
        setMessages([]);
        setShowGroupMenu(false);

        toast.success("Đã rời nhóm 👋");
      } catch (error) {
        const message = error?.response?.data || "Rời nhóm thất bại";

        if (message.includes("Chủ nhóm")) {
          toast.error("Bạn phải chuyển quyền trước khi rời nhóm");
          return;
        }

        toast.error(message);
      }
    };

    

    useEffect(() => {
      if (!conversationStorageKey) return;

      try {
        const saved = localStorage.getItem(conversationStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setConversations(parsed);
          }
        }
      } catch (error) {
        console.log("Load conversations localStorage lỗi:", error);
      }
    }, [conversationStorageKey]);

    useEffect(() => {
      if (!conversationStorageKey) return;

      try {
        localStorage.setItem(conversationStorageKey, JSON.stringify(conversations));
      } catch (error) {
        console.log("Save conversations localStorage lỗi:", error);
      }
    }, [conversations, conversationStorageKey]);

    useEffect(() => {
      if (!currentUserId) return;

      let cancelled = false;

      const syncFriendProfiles = async () => {
        try {
          const res = await getFriendsApi();
          const friends = Array.isArray(res.data) ? res.data : [];
          const friendById = new Map(
            friends
              .map((friend) => normalizeFriendUser(friend))
              .filter(Boolean)
              .map((friend) => [Number(friend.id), friend])
          );

          if (cancelled || friendById.size === 0) return;

          setConversations((prev) =>
            prev.map((conversation) => {
              if (conversation.type !== "PRIVATE") return conversation;

              const targetId = Number(conversation.targetUser?.id);
              const freshFriend = friendById.get(targetId);

              if (!freshFriend) return conversation;

              return {
                ...conversation,
                name: freshFriend.username,
                avatar: resolveAvatar(freshFriend.avatar),
                targetUser: {
                  ...conversation.targetUser,
                  ...freshFriend,
                },
              };
            })
          );

          setSelectedUser((prev) => {
            if (!prev?.id) return prev;

            const freshFriend = friendById.get(Number(prev.id));
            return freshFriend ? { ...prev, ...freshFriend } : prev;
          });
        } catch (error) {
          console.error("Sync friend profiles error:", error);
        }
      };

      syncFriendProfiles();
      const timer = window.setInterval(syncFriendProfiles, 30000);

      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }, [currentUserId]);

    useEffect(() => {
      if (!user?.id) return;

      let statusSub = null;
      let listSub = null;
      let callSub = null;
    let groupSub = null;
    const userId = Number(user.id);

    const syncMyGroups = async (focusGroupId = null) => {
      try {
        const res = await getMyGroupsApi(userId);

        const groupConversations = res.data.map((group) => ({
          id: `group_${group.id}`,
          type: "GROUP",
          name: group.name,
          avatar: resolveAvatar(group.avatar),
          roomId: `group_${group.id}`,
          unreadCount: 0,
          targetGroup: {
            id: group.id,
            name: group.name,
            avatar: group.avatar,
          },
        }));

        setConversations((prev) => {
          const privateConversations = prev.filter((c) => c.type !== "GROUP");
          const prevUnread = new Map(
            prev
              .filter((c) => c.type === "GROUP")
              .map((c) => [c.id, Number(c.unreadCount || 0)])
          );

          const mergedGroups = groupConversations.map((g) => ({
            ...g,
            unreadCount: prevUnread.get(g.id) ?? 0,
          }));

          if (focusGroupId) {
            const targetRoomId = `group_${focusGroupId}`;
            const idx = mergedGroups.findIndex((g) => g.id === targetRoomId);
            if (idx > 0) {
              const [picked] = mergedGroups.splice(idx, 1);
              mergedGroups.unshift(picked);
            }
          }

          return [...mergedGroups, ...privateConversations];
        });
      } catch (err) {
        console.error("Sync group realtime lỗi:", err);
      }
    };

      connectSocket(user.id, () => {
        listSub = subscribeOnlineList((list) => {
          console.log("👥 LIST:", list);
          const newSet = new Set(list.map((id) => Number(id)));
          setOnlineUsers(newSet);
        });

        statusSub = subscribeUserStatus((data) => {
          console.log("🔥 STATUS:", data);

          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            const userId = Number(data.userId);

            if (data.status === "ONLINE") {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }

            return newSet;
          });
        });

        callSub = subscribeCallSignals(user.id, (payload) => {
          if (!payload || payload.type !== "offer") return;
          if (Number(payload.fromUserId) === Number(user.id)) return;

          setCallModal({
            mode: payload.mode || "audio",
            title: payload.callerName || "Cuộc gọi đến",
            avatar: payload.callerAvatar,
            currentUserId: Number(user.id),
            targetUserId: Number(payload.fromUserId),
            targetName: payload.callerName || "Người gọi",
            targetAvatar: payload.callerAvatar,
            incomingOffer: payload.signal,
            isIncoming: true,
            callId: payload.callId,
            roomId: payload.roomId,
          });
        });

        axiosClient
          .get("/users/online")
          .then((res) => {
            const list = Array.isArray(res.data) ? res.data : [];
            setOnlineUsers(new Set(list.map((id) => Number(id))));
          })
          .catch((err) => {
            console.error("Load online users error:", err);
          });

      syncMyGroups();
      groupSub = subscribeGroupUpdates(userId, (event) => {
        const action = String(event?.action || "");
        const groupId = String(event?.groupId || "").trim();
        const roomId = groupId ? `group_${groupId}` : null;

        syncMyGroups(groupId || null);
        if (roomId) {
          moveConversationToTop(roomId);
        }

        const actionMessage = {
          GROUP_CREATED: "Bạn vừa được thêm vào một nhóm mới",
          GROUP_MEMBER_ADDED: "Bạn vừa được thêm vào nhóm",
          GROUP_MEMBER_REMOVED: "Bạn đã rời nhóm / bị xoá khỏi nhóm",
          GROUP_DELETED: "Nhóm đã được giải tán",
        }[action];

        if (actionMessage) {
          toast.info(actionMessage);
        }
      });
      });

      return () => {
        statusSub?.unsubscribe();
        listSub?.unsubscribe();
      callSub?.unsubscribe();
      groupSub?.unsubscribe();
      };
    }, [user?.id]);

    const roomId = useMemo(() => {
      if (selectedGroup) {
        return `group_${selectedGroup.id}`;
      }

      if (!currentUserId || (!selectedUser && !selectedGroup)) return null;

      return [Number(currentUserId), Number(selectedUser.id)]
        .sort((a, b) => a - b)
        .join("_");
    }, [currentUserId, selectedUser, selectedGroup]);

    const handleSelectConversation = async (conversation) => {
      setSelectedConversationId(conversation.id);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversation.id ? { ...item, unreadCount: 0 } : item
        )
      );
      setActiveTab("chat");
      setShowMenu(false);
      setShowMessageSearch(false);
      setShowGroupMenu(false);

      if (conversation.type === "GROUP") {
        setSelectedGroup(conversation.targetGroup);
        setIsRemovedFromGroup(false);
        setSelectedUser(null);
        setBlockStatus({
          blockedByMe: false,
          blockedByOther: false,
        });
        return;
      }

      setSelectedGroup(null);
      setIsRemovedFromGroup(false);
      setSelectedUser(conversation.targetUser);

      try {
        const res = await getBlockStatusApi(conversation.targetUser.id);

        setBlockStatus({
          blockedByMe: res.data?.blockedByMe ?? false,
          blockedByOther: res.data?.blockedByOther ?? false,
        });
      } catch (err) {
        console.log("Check block lỗi", err);
      }
    };

    const handleSelectGroup = (group) => {
      const conversation = {
        id: `group_${group.id}`,
        type: "GROUP",
        name: group.name,
        avatar: resolveAvatar(group.avatar),
        roomId: `group_${group.id}`,
        unreadCount: 0,
        targetGroup: {
          id: group.id,
          name: group.name,
          avatar: group.avatar,
        },
      };

      upsertConversation(conversation);
      setSelectedConversationId(conversation.id);
      setSelectedGroup({
        id: group.id,
        name: group.name,
        avatar: group.avatar,
      });
      setIsRemovedFromGroup(false);
      setSelectedUser(null);
      setShowMenu(false);
      setShowGroupMenu(false);
      setActiveTab("chat");
    };

    

    const handleDeleteConversation = async () => {
      if (!roomId) return;

      try {
        await deleteConversationApi(roomId);

        setMessages([]);
        setSelectedUser(null);
        setSelectedGroup(null);
        setSelectedConversationId(null);
        setConversations((prev) =>
          prev.filter((item) => item.roomId !== roomId)
        );
        setShowMenu(false);
      } catch (error) {
        console.error("❌ Lỗi xoá hội thoại:", error);
      }
    };

    useEffect(() => {
      if (!currentUserId) return;

      const fetchGroups = async () => {
        try {
          const res = await getMyGroupsApi(currentUserId);

          const groupConversations = res.data.map((group) => ({
            id: `group_${group.id}`,
            type: "GROUP",
            name: group.name,
            avatar: resolveAvatar(group.avatar),
            roomId: `group_${group.id}`,
            unreadCount: 0,
            targetGroup: {
              id: group.id,
              name: group.name,
              avatar: group.avatar,
            },
          }));

          setConversations((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newOnes = groupConversations.filter(
              (g) => !existingIds.has(g.id)
            );
            return [...newOnes, ...prev];
          });
        } catch (err) {
          console.error("Load group lỗi:", err);
        }
      };

      fetchGroups();
    }, [currentUserId]);

    useEffect(() => {
      if (!roomId) return;

      const loadHistory = async () => {
        try {
          const res = await getMessagesApi(roomId, 0, 30);
          console.log("API DATA:", res.data);

          const history = res.data.map((msg) => ({
            id: msg.id || msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            createdAt: msg.createdAt,
            deletedBy: msg.deletedBy,
            isRecalled: msg.isRecalled,
            fileUrl: msg.fileUrl,
            type: msg.type,
            originalSenderId: msg.originalSenderId,
            originalContent: msg.originalContent,
            reactions: msg.reactions || {},
            status: msg.status,
            seenBy: msg.seenBy || [],
          }));

          setMessages(history);
        } catch (err) {
          console.error("Load history lỗi:", err);
        }
      };

      setMessages([]);
      loadHistory();
    }, [roomId, setMessages]);

    useEffect(() => {
      if (!selectedGroup?.id || !currentUserId) {
        setIsRemovedFromGroup(false);
        return;
      }

      const checkGroupMembership = async () => {
        try {
          const res = await getGroupMembersApi(selectedGroup.id);
          const memberIds = Array.isArray(res.data)
            ? res.data.map((m) => Number(m?.userId)).filter(Boolean)
            : [];
          const isMember = memberIds.includes(Number(currentUserId));
          setIsRemovedFromGroup(!isMember);
        } catch (error) {
          // API bị từ chối khi user không còn thuộc nhóm
          setIsRemovedFromGroup(true);
        }
      };

      checkGroupMembership();
    }, [selectedGroup, currentUserId]);

    useEffect(() => {
      setShowViewMembersModal(false);
      setViewMembersList([]);

      if (!selectedGroup?.id) {
        setGroupMemberCount(0);
        setGroupMembers([]);
        return;
      }

      let cancelled = false;

      (async () => {
        try {
          const res = await getGroupMembersApi(selectedGroup.id);
          const n = Array.isArray(res.data) ? res.data.length : 0;
          if (!cancelled) {
            const members = Array.isArray(res.data) ? res.data : [];
            setGroupMembers(members);
            setGroupMemberCount(n);
          }
        } catch {
          if (!cancelled) {
            setGroupMembers([]);
            setGroupMemberCount(0);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [selectedGroup?.id]);

    useEffect(() => {
      const handleLogoutSync = (event) => {
        if (event.key === "logout") {
          navigate("/", { replace: true });
        }
      };

      window.addEventListener("storage", handleLogoutSync);

      return () => {
        window.removeEventListener("storage", handleLogoutSync);
      };
    }, [navigate]);

    useEffect(() => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/", { replace: true });
      }
    }, [navigate]);

    useEffect(() => {
      if (!currentUserId) return;

      const loadFriendRequestNotifications = async () => {
        try {
          const res = await getFriendRequestsApi();
          const list = Array.isArray(res.data) ? res.data : [];
          setFriendRequestNotifications(list);
        } catch (err) {
          console.error("Load notification requests error:", err);
          setFriendRequestNotifications([]);
        }
      };

      loadFriendRequestNotifications();
      const timer = window.setInterval(loadFriendRequestNotifications, 30000);

      return () => window.clearInterval(timer);
    }, [currentUserId]);

    useEffect(() => {
      if (!currentUserId || conversations.length === 0) return;

      const roomIds = [
        ...new Set(
          conversations
            .map((conversation) => conversation.roomId)
            .filter(Boolean)
        ),
      ];

      roomIds.forEach((joinedRoomId) => {
        joinRoom(
          joinedRoomId,
          (message) => {
            if (!message) return;

            const incomingRoomId = message.roomId || joinedRoomId;
            const incomingConversationId = incomingRoomId.startsWith("group_")
              ? incomingRoomId
              : `private_${incomingRoomId}`;
            const matchingConversation = conversations.find(
              (conversation) => conversation.roomId === incomingRoomId
            );

            moveConversationToTop(incomingRoomId);
            setConversations((prev) =>
              prev.map((conversation) =>
                conversation.roomId === incomingRoomId
                  ? {
                      ...conversation,
                      lastMessage: summarizeLastMessage(message),
                      lastMessageAt: message.createdAt || new Date().toISOString(),
                    }
                  : conversation
              )
            );

            const isActiveConversation =
              selectedConversationId === incomingConversationId;
            const isIncomingFromOther =
              Number(message.senderId) !== Number(currentUserId);
            const isMutedIncoming =
              mutedConversationIds.has(incomingConversationId);

            if (isIncomingFromOther && !isMutedIncoming) {
              showIncomingMessageNotification(message, matchingConversation);
            }

            if (isActiveConversation) {
              addMessage({
                id: message.id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                content: message.content,
                createdAt: message.createdAt,
                isRecalled: message.isRecalled,
                fileUrl: message.fileUrl,
                type: message.type,
                originalSenderId: message.originalSenderId,
                originalContent: message.originalContent,
                reactions: message.reactions || {},
                status: message.status,
                seenBy: message.seenBy || [],
              });
              return;
            }

            if (!isIncomingFromOther || isMutedIncoming) return;

            setConversations((prev) =>
              prev.map((conversation) =>
                conversation.id === incomingConversationId
                  ? {
                      ...conversation,
                      unreadCount: (conversation.unreadCount || 0) + 1,
                    }
                  : conversation
              )
            );
          },
          (deletedId) => {
            const activeConversation = conversations.find(
              (conversation) => conversation.id === selectedConversationId
            );

            if (!activeConversation || activeConversation.roomId !== joinedRoomId) {
              return;
            }

            setMessages((prev) =>
              prev.map((m) =>
                String(m.id || m._id) === String(deletedId)
                  ? { ...m, deletedBy: currentUserId }
                  : m
              )
            );
          },
          (recallId) => {
            const activeConversation = conversations.find(
              (conversation) => conversation.id === selectedConversationId
            );

            if (!activeConversation || activeConversation.roomId !== joinedRoomId) {
              return;
            }

            setMessages((prev) =>
              prev.map((m) =>
                String(m.id || m._id) === String(recallId)
                  ? { ...m, isRecalled: true }
                  : m
              )
            );
          },
          (moderationMessage) => {
            const activeConversation = conversations.find(
              (conversation) => conversation.id === selectedConversationId
            );

            if (!activeConversation || activeConversation.roomId !== joinedRoomId) {
              return;
            }

            addMessage({
              id: moderationMessage.id || `violation-${Date.now()}`,
              senderId: Number(currentUserId),
              receiverId: moderationMessage.receiverId,
              roomId: joinedRoomId,
              content: moderationMessage.content || VIOLATION_MESSAGE,
              type: "VIOLATION",
              createdAt: moderationMessage.createdAt || new Date().toISOString(),
              isLocalOnly: true,
            });

            toast.warning("Tin nhắn đã bị xoá do vi phạm tiêu chuẩn cộng đồng");
          },
          null,
          (seenMessages) => {
            const activeConversation = conversations.find(
              (conversation) => conversation.id === selectedConversationId
            );

            if (!activeConversation || activeConversation.roomId !== joinedRoomId) {
              return;
            }

            const seenById = new Map(
              seenMessages.map((message) => [String(message.id || message._id), message])
            );

            setMessages((prev) =>
              prev.map((message) => {
                const updated = seenById.get(String(message.id || message._id));
                return updated
                  ? { ...message, status: updated.status, seenBy: updated.seenBy || [] }
                  : message;
              })
            );
          }
        );
      });

      return () => {
        roomIds.forEach((joinedRoomId) => leaveRoom(joinedRoomId));
      };
    }, [
      conversations,
      currentUserId,
      mutedConversationIds,
      selectedConversationId,
      addMessage,
      setMessages,
    ]);

    const handleSendMessage = (overrideContent) => {
      if (selectedGroup && isRemovedFromGroup) {
        console.warn("BLOCK SEND: removed from group", {
          groupId: selectedGroup.id,
          currentUserId,
        });
        toast.error("Bạn đã bị xoá ra khỏi nhóm và không thể trả lời cuộc trò chuyện này");
        return;
      }

      if (!selectedGroup && (blockStatus.blockedByMe || blockStatus.blockedByOther)) {
        toast.error("Không thể gửi tin nhắn");
        return;
      }

      const content = String(overrideContent ?? input ?? "").trim();
      if (!content) return;
      if (!currentUserId || (!selectedUser && !selectedGroup)) return;

      const createdAt = new Date().toISOString();
      const clientId = `local-${currentUserId}-${Date.now()}`;
      const msg = {
        senderId: Number(currentUserId),
        receiverId: selectedUser?.id || null,
        roomId,
        content,
        type: "TEXT",
        createdAt,
      };

      addMessage({
        ...msg,
        id: clientId,
        clientId,
        status: "SENDING",
        isOptimistic: true,
        reactions: {},
        seenBy: [],
      });

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.roomId === roomId
            ? {
                ...conversation,
                lastMessage: summarizeLastMessage(msg),
                lastMessageAt: createdAt,
              }
            : conversation
        )
      );

      if (selectedGroup) {
        upsertConversation({
          id: `group_${selectedGroup.id}`,
          type: "GROUP",
          name: selectedGroup.name,
          avatar: resolveAvatar(selectedGroup.avatar),
          roomId: `group_${selectedGroup.id}`,
          targetGroup: selectedGroup,
        });
      } else if (selectedUser) {
        const privateRoomId = [Number(currentUserId), Number(selectedUser.id)]
          .sort((a, b) => a - b)
          .join("_");

        upsertConversation({
          id: `private_${privateRoomId}`,
          type: "PRIVATE",
          name: selectedUser.username,
          avatar: resolveAvatar(selectedUser.avatar),
          roomId: privateRoomId,
          targetUser: selectedUser,
        });
      }

      setInput("");

      const sent = sendMessageSocket(msg);
      if (!sent) {
        toast.warning("Đang kết nối lại, tin nhắn sẽ được gửi khi kết nối ổn định");
      }
    };

    const handleSendFile = (fileUrl) => {
      if (selectedGroup && isRemovedFromGroup) {
        console.warn("BLOCK SEND FILE: removed from group", {
          groupId: selectedGroup.id,
          currentUserId,
        });
        toast.error("Bạn đã bị xoá ra khỏi nhóm và không thể trả lời cuộc trò chuyện này");
        return;
      }

      if (!selectedGroup && (blockStatus.blockedByMe || blockStatus.blockedByOther)) {
        toast.error("Bạn đã chặn người này");
        return;
      }

      if (!currentUserId || (!selectedUser && !selectedGroup)) return;

      const msg = {
        senderId: Number(currentUserId),
        receiverId: selectedUser?.id || null,
        roomId,
        type: "FILE",
        fileUrl,
      };

      sendMessageSocket(msg);
    };

    const handleSelectUser = async (u) => {
      const userId = u.friendId || u.userId || u.id;

      const targetUser = {
        id: userId,
        username: u.username,
        avatar: u.avatar,
      };

      const privateRoomId = [Number(currentUserId), Number(userId)]
        .sort((a, b) => a - b)
        .join("_");

      const conversation = {
        id: `private_${privateRoomId}`,
        type: "PRIVATE",
        name: u.username,
        avatar: resolveAvatar(u.avatar),
        roomId: privateRoomId,
        unreadCount: 0,
        targetUser,
      };

      setSelectedUser(targetUser);
      setSelectedGroup(null);
      setSelectedConversationId(conversation.id);
      setShowMenu(false);
      setShowGroupMenu(false);
      setActiveTab("chat");
      upsertConversation(conversation);

      try {
        const res = await getBlockStatusApi(userId);

        setBlockStatus({
          blockedByMe: res.data?.blockedByMe ?? false,
          blockedByOther: res.data?.blockedByOther ?? false,
        });
      } catch (err) {
        console.log("Check block lỗi", err);
      }
    };

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      disconnectSocket();

      localStorage.setItem("logout", Date.now());

      navigate("/", { replace: true });
    };

    const handleOpenViewMembersModal = async () => {
      if (!selectedGroup?.id) return;

      setShowGroupMenu(false);
      setShowViewMembersModal(true);
      setViewMembersLoading(true);
      setViewMembersList([]);

      try {
        const [friendsRes, membersRes] = await Promise.all([
          getFriendsApi(),
          getGroupMembersApi(selectedGroup.id),
        ]);

        const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
        const friendById = new Map(
          friends.map((friend) => [getFriendId(friend), friend])
        );

        const members = Array.isArray(membersRes.data) ? membersRes.data : [];

        const rows = members
          .map((m) => enrichMemberFromDto(m, friendById))
          .filter(Boolean);

        setViewMembersList(rows);
        setGroupMemberCount(rows.length);
      } catch (error) {
        console.error("View members lỗi:", error);
        toast.error("Không tải được danh sách thành viên");
      } finally {
        setViewMembersLoading(false);
      }
    };

    const handleOpenAddMemberModal = async () => {
      try {
        if (!selectedGroup?.id) return;

        const [friendsRes, membersRes] = await Promise.all([
          getFriendsApi(),
          getGroupMembersApi(selectedGroup.id),
        ]);

        const list = Array.isArray(friendsRes.data) ? friendsRes.data : [];
        const existingMemberIds = new Set(
          Array.isArray(membersRes.data)
            ? membersRes.data.map((m) => Number(m?.userId)).filter(Boolean)
            : []
        );

        const filteredCandidates = list.filter(
          (friend) => !existingMemberIds.has(getFriendId(friend))
        );

        setFriendCandidates(filteredCandidates);
        setSelectedMemberIds([]);
        setShowAddMemberModal(true);
        setShowGroupMenu(false);
      } catch (error) {
        console.error("Load friends lỗi:", error);
        toast.error("Không tải được danh sách bạn bè");
      }
    };

    const handleOpenRemoveMemberModal = async () => {
      try {
        if (!selectedGroup?.id) return;

        const [friendsRes, membersRes] = await Promise.all([
          getFriendsApi(),
          getGroupMembersApi(selectedGroup.id),
        ]);

        const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
        const members = Array.isArray(membersRes.data) ? membersRes.data : [];

        const friendById = new Map(
          friends.map((friend) => [getFriendId(friend), friend])
        );

        const mappedMembers = members
          .map((m) => enrichMemberFromDto(m, friendById))
          .filter(Boolean)
          .filter((row) => row.id && row.id !== Number(currentUserId));

        setMemberCandidates(mappedMembers);
        setSelectedMemberIds([]);
        setShowRemoveMemberModal(true);
        setShowGroupMenu(false);
      } catch (error) {
        console.error("Load members lỗi:", error);
        toast.error("Không tải được danh sách thành viên");
      }
    };

    const handleOpenUpdateRoleModal = async () => {
      try {
        if (!selectedGroup?.id) return;

        const [friendsRes, membersRes] = await Promise.all([
          getFriendsApi(),
          getGroupMembersApi(selectedGroup.id),
        ]);

        const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
        const members = Array.isArray(membersRes.data) ? membersRes.data : [];
        const friendById = new Map(
          friends.map((friend) => [getFriendId(friend), friend])
        );

        const mappedRoleCandidates = members
          .map((m) => enrichMemberFromDto(m, friendById))
          .filter(Boolean)
          .filter(
            (member) =>
              member.id &&
              member.id !== Number(currentUserId) &&
              member.role !== "OWNER"
          );

        setRoleCandidates(mappedRoleCandidates);
        setSelectedRoleUserId(mappedRoleCandidates[0]?.id ?? null);
        setSelectedRoleValue(mappedRoleCandidates[0]?.role ?? "MEMBER");
        setShowUpdateRoleModal(true);
        setShowGroupMenu(false);
      } catch (error) {
        console.error("Load role members lỗi:", error);
        toast.error("Không tải được danh sách thành viên");
      }
    };

    const toggleSelectMember = (friend) => {
      const id = getFriendId(friend);
      if (!id) return;

      setSelectedMemberIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    };

    const handleAddMembersToGroup = async () => {
      if (!selectedGroup?.id || selectedMemberIds.length === 0) return;

      try {
        await Promise.all(
          selectedMemberIds.map((userId) => addMemberApi(selectedGroup.id, userId))
        );
        toast.success("Thêm thành viên vào nhóm thành công! 🎉");
        setShowAddMemberModal(false);
        setSelectedMemberIds([]);
        try {
          const countRes = await getGroupMembersApi(selectedGroup.id);
          setGroupMemberCount(
            Array.isArray(countRes.data) ? countRes.data.length : 0
          );
        } catch {
          /* ignore */
        }
      } catch (error) {
        console.error("Add member lỗi:", error);
        const message = error?.response?.data || "Thêm thành viên thất bại";

        if (typeof message === "string" && message.includes("Không thuộc nhóm")) {
          toast.error("Không thuộc nhóm");
          return;
        }

        if (typeof message === "string" && message.includes("Không có quyền")) {
          toast.error("Không có quyền");
          return;
        }

        if (typeof message === "string" && message.includes("User đã trong nhóm")) {
          toast.error("User đã trong nhóm");
          return;
        }

        toast.error("Thêm thành viên thất bại");
      }
    };

    const handleRemoveMembersFromGroup = async () => {
      if (!selectedGroup?.id || selectedMemberIds.length === 0) return;

      try {
        await Promise.all(
          selectedMemberIds.map((userId) =>
            removeMemberApi(selectedGroup.id, userId, Number(currentUserId))
          )
        );
        toast.success("Xoá thành viên khỏi nhóm thành công! 🎉");
        setMemberCandidates((prev) =>
          prev.filter((item) => !selectedMemberIds.includes(getFriendId(item)))
        );
        setSelectedMemberIds([]);
        setShowRemoveMemberModal(false);
        try {
          const countRes = await getGroupMembersApi(selectedGroup.id);
          setGroupMemberCount(
            Array.isArray(countRes.data) ? countRes.data.length : 0
          );
        } catch {
          /* ignore */
        }
      } catch (error) {
        console.error("Remove member lỗi:", error);
        const message = error?.response?.data || "Xoá thành viên thất bại";

        if (
          typeof message === "string" &&
          message.includes("Bạn không thuộc nhóm")
        ) {
          toast.error("Bạn không thuộc nhóm");
          return;
        }

        if (
          typeof message === "string" &&
          message.includes("Bạn không có quyền")
        ) {
          toast.error("Bạn không có quyền");
          return;
        }

        if (
          typeof message === "string" &&
          message.includes("Không thể tự xoá chính mình")
        ) {
          toast.error("Không thể tự xoá chính mình");
          return;
        }

        if (
          typeof message === "string" &&
          message.includes("User không trong nhóm")
        ) {
          toast.error("User không trong nhóm");
          return;
        }

        toast.error("Xoá thành viên thất bại");
      }
    };

    const handleDeleteGroup = async () => {
      if (!selectedGroup?.id || !currentUserId) return;

      try {
        await deleteGroupApi(selectedGroup.id, Number(currentUserId));

        setConversations((prev) =>
          prev.filter((item) => item.id !== `group_${selectedGroup.id}`)
        );
        setSelectedGroup(null);
        setSelectedConversationId(null);
        setMessages([]);
        setShowGroupMenu(false);

        toast.success("Giải tán nhóm thành công! 🎉");
      } catch (error) {
        const message = error?.response?.data || "Giải tán nhóm thất bại";

        if (typeof message === "string" && message.includes("Group không tồn tại")) {
          toast.error("Group không tồn tại");
          return;
        }

        if (
          typeof message === "string" &&
          message.includes("Bạn không có quyền giải tán nhóm")
        ) {
          toast.error("Bạn không có quyền giải tán nhóm");
          return;
        }

        toast.error("Giải tán nhóm thất bại");
      }
    };

    const handleUpdateRole = async () => {
      if (!selectedGroup?.id || !selectedRoleUserId || !currentUserId) return;

      try {
        await updateRoleApi(
          selectedGroup.id,
          Number(selectedRoleUserId),
          selectedRoleValue,
          Number(currentUserId)
        );

        setRoleCandidates((prev) =>
          prev.map((member) =>
            member.id === Number(selectedRoleUserId)
              ? { ...member, role: selectedRoleValue }
              : member
          )
        );
        setShowUpdateRoleModal(false);
        toast.success("Cập nhật quyền thành công! 🎉");
      } catch (error) {
        const message = error?.response?.data || "Cập nhật quyền thất bại";

        if (typeof message === "string" && message.includes("Không thuộc nhóm")) {
          toast.error("Không thuộc nhóm");
          return;
        }
        if (typeof message === "string" && message.includes("Không có quyền")) {
          toast.error("Không có quyền");
          return;
        }
        if (typeof message === "string" && message.includes("User không tồn tại")) {
          toast.error("User không tồn tại");
          return;
        }
        if (typeof message === "string" && message.includes("Không thể sửa OWNER")) {
          toast.error("Không thể sửa OWNER");
          return;
        }

        toast.error("Cập nhật quyền thất bại");
      }
    };

    const handleRenameGroup = async () => {
      if (!selectedGroup?.id) return;

      const nextName = window.prompt("Nhập tên nhóm mới", selectedGroup.name || "");
      if (!nextName || !nextName.trim()) return;

      try {
        const res = await renameGroupApi(selectedGroup.id, nextName.trim());
        const updated = res.data;
        const avatar = resolveAvatar(updated.avatar);

        setSelectedGroup((prev) => ({ ...prev, name: updated.name, avatar: updated.avatar }));
        setConversations((prev) =>
          prev.map((item) =>
            item.id === `group_${updated.id}`
              ? {
                  ...item,
                  name: updated.name,
                  avatar,
                  targetGroup: { ...item.targetGroup, name: updated.name, avatar: updated.avatar },
                }
              : item
          )
        );
        toast.success("Đã đổi tên nhóm");
      } catch (error) {
        toast.error(error?.response?.data || "Đổi tên nhóm thất bại");
      }
    };

    const handleChangeGroupAvatar = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!selectedGroup?.id || !file) return;

      try {
        const res = await updateGroupAvatarApi(selectedGroup.id, file);
        const updated = res.data;
        const avatar = resolveAvatar(updated.avatar);

        setSelectedGroup((prev) => ({ ...prev, avatar: updated.avatar }));
        setConversations((prev) =>
          prev.map((item) =>
            item.id === `group_${updated.id}`
              ? {
                  ...item,
                  avatar,
                  targetGroup: { ...item.targetGroup, avatar: updated.avatar },
                }
              : item
          )
        );
        toast.success("Đã đổi ảnh nhóm");
      } catch (error) {
        toast.error(error?.response?.data || "Đổi ảnh nhóm thất bại");
      }
    };

    const currentTitle = selectedGroup
      ? selectedGroup.name
      : selectedUser?.username || "Cuộc trò chuyện";

    const currentAvatar = selectedGroup
      ? resolveAvatar(selectedGroup.avatar)
      : resolveAvatar(selectedUser?.avatar);

    const mediaMessages = useMemo(
      () =>
        messages
          .filter((message) => message?.fileUrl?.match?.(/\.(jpg|jpeg|png|gif|webp)$/i))
          .slice(-8)
          .reverse(),
      [messages]
    );

    const visibleConversations = useMemo(() => {
      const keyword = conversationSearch.trim().toLowerCase();

      return conversations
        .filter((item) => {
          if (conversationFilter === "unread") return Number(item.unreadCount || 0) > 0;
          if (conversationFilter === "group") return item.type === "GROUP";
          if (conversationFilter === "private") return item.type !== "GROUP";
          return true;
        })
        .filter((item) => {
          if (!keyword) return true;
          return String(item.name || "").toLowerCase().includes(keyword);
        });
    }, [conversationFilter, conversationSearch, conversations]);

    const formatConversationTime = (value) => {
      if (!value) return "";
      try {
        return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch {
        return "";
      }
    };

    const summarizeLastMessage = (message) => {
      const type = String(message?.type || "").toUpperCase();
      if (type === "FILE") return "Đã gửi một tệp";
      if (type === "SYSTEM") return message?.content || "Cập nhật hội thoại";
      if (type === "VIOLATION") return "Tin nhắn vi phạm đã bị chặn";
      return String(message?.content || "").trim() || "Tin nhắn mới";
    };

    return (
      <div className="w-screen h-screen flex app-shell overflow-hidden text-slate-800 font-sans relative">
        <div className="z-30 light-rail-wrap">
          <Sidebar
            user={user}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            onLogout={handleLogout}
            onOpenProfile={() => setShowProfile(true)}
            onChangePassword={() => setShowChangePassword(true)}
            onSelectTab={setActiveTab}
            activeTab={activeTab}
            notificationCount={notificationCount}
          />
        </div>

        {(activeTab === "chat" || activeTab === "group") && (
          <aside className="conversation-panel">
            <div className="conversation-panel-head">
              <div>
                <div className="conversation-title">Cuộc trò chuyện</div>
                <div className="conversation-subtitle">{conversations.length} hội thoại · Safe Chat bật</div>
              </div>
              <div className="safe-badge"><ShieldCheck size={16} /> AI</div>
            </div>

            <div className="conversation-tools">
              <input
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="conversation-search-input"
                placeholder="Tìm hội thoại"
              />
              <div className="conversation-filter-tabs">
                {[
                  ["all", "Tất cả"],
                  ["unread", "Chưa đọc"],
                  ["private", "Cá nhân"],
                  ["group", "Nhóm"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setConversationFilter(id)}
                    className={conversationFilter === id ? "active" : ""}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="conversation-list flex-1 overflow-y-auto p-3 space-y-2">
              {visibleConversations.length === 0 ? (
                <div className="empty-conversation-note">Chưa có cuộc trò chuyện nào</div>
              ) : (
                visibleConversations.map((item) => {
                  const isActive = selectedConversationId === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectConversation(item)}
                      className={`conversation-item ${isActive ? "active" : ""}`}
                    >
                      <img
                        src={item.avatar || DEFAULT_AVATAR}
                        alt=""
                        className="conversation-avatar"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="conversation-name-row">
                          <span className="truncate">{item.name}</span>
                          <span className="conversation-time">
                            {formatConversationTime(item.lastMessageAt)}
                          </span>
                          {item.unreadCount > 0 && (
                            <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-500 text-white text-[11px] leading-[22px] text-center font-semibold">
                              {item.unreadCount > 99 ? "99+" : item.unreadCount}
                            </span>
                          )}
                        </div>
                        {item.lastMessage && (
                          <div className="conversation-meta">{item.lastMessage}</div>
                        )}
                        <div className="conversation-meta">
                          {item.type === "GROUP" ? "Nhóm chat" : "Chat cá nhân"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        <main className="chat-main flex-1 flex flex-col relative z-40">
          {activeTab === "chat" &&
            (!selectedUser && !selectedGroup ? (
              <div className="empty-chat-state">
                <div className="empty-chat-icon">💬</div>
                <h2>Chọn một cuộc trò chuyện</h2>
                <p>Bắt đầu nhắn tin, gửi file, gọi thoại/video và dùng AI Safe Chat.</p>
              </div>
            ) : (
              <>
                <header className="chat-header">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="avatar-ring"></div>
                      <img
                        src={currentAvatar}
                        alt=""
                        className={`relative w-12 h-12 rounded-full object-cover border-2 border-white bg-slate-100 ${
                          selectedGroup ? "cursor-pointer" : ""
                        }`}
                        onClick={() => {
                          if (!selectedGroup) return;
                          setShowGroupMenu((prev) => !prev);
                        }}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      {!selectedGroup && (
                        <span
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                            onlineUsers.has(Number(selectedUser?.id))
                              ? "bg-emerald-500"
                              : "bg-slate-500"
                          }`}
                        />
                      )}
                      {selectedGroup && showGroupMenu && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-14 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={handleOpenViewMembersModal}
                            className="w-full text-left px-4 py-3 hover:bg-slate-700/80 text-slate-100 transition border-b border-slate-700/80"
                          >
                            👥 Xem thành viên
                            <span className="ml-1.5 text-xs font-semibold text-indigo-300">
                              ({groupMemberCount})
                            </span>
                          </button>
                          <button
                            onClick={handleOpenAddMemberModal}
                            className="w-full text-left px-4 py-3 hover:bg-blue-500/10 text-blue-300 transition"
                          >
                            ➕ Thêm thành viên
                          </button>
                          <button
                            onClick={handleOpenRemoveMemberModal}
                            className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-300 transition"
                          >
                            ➖ Xoá thành viên
                          </button>
                          <button
                            onClick={handleOpenUpdateRoleModal}
                            className="w-full text-left px-4 py-3 hover:bg-violet-500/10 text-violet-300 transition"
                          >
                            🛡️ Cập nhật quyền
                          </button>
                          <button
                            onClick={handleDeleteGroup}
                            className="w-full text-left px-4 py-3 hover:bg-red-500/20 text-red-400 transition"
                          >
                            🗑️ Giải tán nhóm
                          </button>

                          <button
                            onClick={handleLeaveGroup}
                            className="w-full text-left px-4 py-3 hover:bg-yellow-500/10 text-yellow-300 transition"
                          >
                            🚪 Rời nhóm
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <h2 className="text-slate-900 text-lg font-bold tracking-tight">
                        {currentTitle}
                      </h2>
                      <div className="flex items-center gap-1.5">
                        {!selectedGroup &&
                        onlineUsers.has(Number(selectedUser?.id)) ? (
                          <>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-emerald-400 font-medium">
                              Đang hoạt động
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            {selectedGroup
                              ? `Nhóm chat · ${groupMemberCount} thành viên`
                              : "Ngoại tuyến"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 relative">
                    {!selectedGroup && selectedUser && (
                      <>
                        <button
                          onClick={() =>
                            setCallModal({
                              mode: "audio",
                              title: currentTitle,
                              avatar: currentAvatar,
                              currentUserId,
                              targetUserId: selectedUser.id,
                              targetName: currentTitle,
                              targetAvatar: currentAvatar,
                              callerName: user?.username || "Người gọi",
                              callerAvatar: user?.avatar,
                              roomId,
                            })
                          }
                          className="header-action-btn"
                          title="Gọi thoại"
                        >
                          <Phone size={20} />
                        </button>
                        <button
                          onClick={() =>
                            setCallModal({
                              mode: "video",
                              title: currentTitle,
                              avatar: currentAvatar,
                              currentUserId,
                              targetUserId: selectedUser.id,
                              targetName: currentTitle,
                              targetAvatar: currentAvatar,
                              callerName: user?.username || "Người gọi",
                              callerAvatar: user?.avatar,
                              roomId,
                            })
                          }
                          className="header-action-btn"
                          title="Gọi video"
                        >
                          <Video size={20} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowMessageSearch((prev) => !prev)}
                      className={`header-action-btn ${
                        showMessageSearch ? "active" : ""
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </button>
                    {(selectedUser || selectedGroup) && (
                      <button
                        type="button"
                        onClick={() => setShowConversationInfo((prev) => !prev)}
                        className={`header-action-btn ${
                          showConversationInfo ? "active" : ""
                        }`}
                        title="Thông tin hội thoại"
                      >
                        <Info size={20} />
                      </button>
                    )}

                    {!selectedGroup && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu((prev) => !prev);
                          }}
                          className="header-action-btn text-xl"
                        >
                          ⋮
                        </button>

                        {showMenu && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-12 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                          >
                            <button
                              onClick={async () => {
                                try {
                                  if (blockStatus.blockedByMe) {
                                    await unblockUserApi(selectedUser.id);
                                  } else {
                                    await blockUserApi(selectedUser.id);
                                  }

                                  const res = await getBlockStatusApi(
                                    selectedUser.id
                                  );

                                  setBlockStatus({
                                    blockedByMe: res.data?.blockedByMe ?? false,
                                    blockedByOther:
                                      res.data?.blockedByOther ?? false,
                                  });

                                  setShowMenu(false);
                                } catch (err) {
                                  console.log("Block/unblock lỗi:", err);
                                }
                              }}
                              className={`w-full text-left px-4 py-3 transition ${
                                blockStatus.blockedByMe
                                  ? "hover:bg-green-500/10 text-green-400"
                                  : "hover:bg-yellow-500/10 text-yellow-400"
                              }`}
                            >
                              {blockStatus.blockedByMe
                                ? "🔓 Bỏ chặn"
                                : "🚫 Chặn người dùng"}
                            </button>

                            <div className="h-px bg-slate-700" />

                            <button
                              onClick={handleDeleteConversation}
                              className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 transition"
                            >
                              🗑️ Xoá hội thoại
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </header>

                <div className={`chat-workspace ${showConversationInfo ? "with-info" : ""}`}>
                  <section className="chat-thread-column">
                <div className="flex-1 relative overflow-hidden chat-box-wrap">
                  <ChatBox
                    messages={messages}
                    messagesEndRef={messagesEndRef}
                    currentUserId={currentUserId}
                    setMessages={setMessages}
                    onForwardMessage={handleForwardClick}
                    showSearch={showMessageSearch}
                    onCloseSearch={() => setShowMessageSearch(false)}
                    isGroup={Boolean(selectedGroup)}
                    groupMembers={groupMembers}
                  />
                </div>

                <div className="chat-input-dock">
                  {selectedGroup ? (
                    isRemovedFromGroup ? (
                      <div className="text-center text-red-400 font-medium">
                        🚫 Bạn đã bị xoá ra khỏi nhóm và không thể trả lời cuộc
                        trò chuyện này
                      </div>
                    ) : (
                      <ChatInput
                        input={input}
                        setInput={setInput}
                        onSend={handleSendMessage}
                        onSendFile={handleSendFile}
                      />
                    )
                  ) : blockStatus.blockedByMe ? (
                    <div className="text-center text-red-400">
                      🚫 Bạn đã chặn người này
                    </div>
                  ) : blockStatus.blockedByOther ? (
                    <div className="text-center text-yellow-400">
                      ⚠️ Bạn đã bị người này chặn
                    </div>
                  ) : (
                    <ChatInput
                      input={input}
                      setInput={setInput}
                      onSend={handleSendMessage}
                      onSendFile={handleSendFile}
                    />
                  )}
                </div>

                  </section>

                {showConversationInfo && (
                  <aside className="conversation-info-panel">
                    <div className="conversation-info-card">
                      <img
                        src={currentAvatar}
                        alt=""
                        className="conversation-info-avatar"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      <h3>{currentTitle}</h3>
                      <p>
                        {selectedGroup
                          ? `${groupMemberCount} thành viên`
                          : onlineUsers.has(Number(selectedUser?.id))
                            ? "Đang hoạt động"
                            : "Ngoại tuyến"}
                      </p>
                      {selectedGroup && (
                        <div className="group-edit-actions">
                          <button type="button" onClick={handleRenameGroup} title="Đổi tên nhóm">
                            <Pencil size={16} />
                            <span>Đổi tên</span>
                          </button>
                          <label title="Đổi ảnh nhóm">
                            <Camera size={16} />
                            <span>Đổi ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleChangeGroupAvatar}
                              hidden
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div
                      className={`conversation-info-actions ${
                        isCurrentConversationMuted ? "is-muted" : ""
                      } ${isCurrentConversationPinned ? "is-pinned" : ""}`}
                      onClick={(event) => {
                        const button = event.target.closest("button");
                        if (!button) return;
                        const index = Array.from(event.currentTarget.children).indexOf(button);
                        if (index === 0) toggleMuteCurrentConversation();
                        if (index === 1) togglePinCurrentConversation();
                        if (index === 2) openCreateGroupFromConversation();
                      }}
                    >
                      <button type="button" title="Tắt thông báo">
                        <BellOff size={20} />
                        <span>Tắt thông báo</span>
                      </button>
                      <button type="button" title="Ghim hội thoại">
                        <Pin size={20} />
                        <span>Ghim hội thoại</span>
                      </button>
                      <button
                        type="button"
                        title="Tạo nhóm"
                        onClick={() => setActiveTab("group")}
                      >
                        <UserPlus size={20} />
                        <span>Tạo nhóm</span>
                      </button>
                    </div>

                    <div className="conversation-info-section">
                      <h4>Ảnh/Video</h4>
                      {mediaMessages.length === 0 ? (
                        <div className="conversation-info-empty">
                          Chưa có ảnh hoặc video
                        </div>
                      ) : (
                        <div className="conversation-media-grid">
                          {mediaMessages.map((message) => (
                            <img
                              key={message.id || message._id || message.fileUrl}
                              src={
                                String(message.fileUrl).startsWith("/")
                                  ? `${getBackendUrl()}${message.fileUrl}`
                                  : message.fileUrl
                              }
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </aside>
                )}
                </div>
              </>
            ))}

            

          {activeTab !== "chat" && activeTab !== "group" && (
            <div className="flex-1 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === "friends" && (
                <FriendsList
                  onSelectUser={handleSelectUser}
                  onlineUsers={onlineUsers}
                />
              )}
              {activeTab === "requests" && <FriendRequests />}
              {activeTab === "search" && (
                <FriendSearch onSelectUser={handleSelectUser} />
              )}
              {activeTab === "notifications" && (
                <div className="max-w-3xl">
                  <div className="mb-5">
                    <h2 className="text-slate-900 text-2xl font-bold">
                      Thông báo
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Cập nhật lời mời kết bạn và tin nhắn chưa đọc
                    </p>
                  </div>

                  {notificationCount === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-500">
                      Chưa có thông báo mới
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friendRequestNotifications.map((request) => (
                        <button
                          key={request.friendshipId || request.id}
                          type="button"
                          onClick={() => setActiveTab("requests")}
                          className="w-full flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/90 p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50 transition"
                        >
                          <img
                            src={getImageUrl(request.avatar) || DEFAULT_AVATAR}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_AVATAR;
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {request.username || "Người dùng"} đã gửi lời mời kết bạn
                            </p>
                            <p className="text-sm text-slate-500">
                              Bấm để xem và phản hồi lời mời
                            </p>
                          </div>
                        </button>
                      ))}

                      {conversations
                        .filter((conversation) => Number(conversation.unreadCount || 0) > 0)
                        .map((conversation) => (
                          <button
                            key={conversation.id}
                            type="button"
                            onClick={() => handleSelectConversation(conversation)}
                            className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50 transition"
                          >
                            <img
                              src={conversation.avatar || DEFAULT_AVATAR}
                              alt=""
                              className="w-11 h-11 rounded-full object-cover bg-slate-100"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_AVATAR;
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 truncate">
                                {conversation.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {conversation.unreadCount} tin nhắn chưa đọc
                              </p>
                            </div>
                            <span className="min-w-[24px] h-6 px-2 rounded-full bg-blue-500 text-white text-xs leading-6 text-center font-semibold">
                              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "group" && (
            <CreateGroup
              user={user}
              friends={[]}
              onCreated={(group) => {
                handleSelectGroup(group);
                setShowMenu(false);
              }}
            />
          )}
        </main>

        {showForwardModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="bg-slate-800 p-4 rounded-xl w-96 max-h-[500px] overflow-y-auto">
              <h3 className="text-white mb-3">Chọn người để chuyển tiếp</h3>

              <div className="mb-4">
                <h4 className="text-slate-300 text-sm mb-2">
                  Chuyển tiếp tới nhóm
                </h4>
                {forwardableGroups.length === 0 ? (
                  <div className="text-slate-500 text-sm">
                    Không có nhóm phù hợp để chuyển tiếp
                  </div>
                ) : (
                  <div className="space-y-2">
                    {forwardableGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() =>
                          handleForwardToTarget({
                            id: group.targetGroup?.id,
                            type: "GROUP",
                          })
                        }
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200"
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <h4 className="text-slate-300 text-sm mb-2">
                Chuyển tiếp tới cá nhân
              </h4>
              <FriendsList
                onSelectUser={(user) => handleForwardToTarget(user)}
              />

              <button
                onClick={() => setShowForwardModal(false)}
                className="mt-3 text-sm text-slate-400"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {showViewMembersModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="bg-slate-800 p-4 rounded-xl w-[440px] max-h-[560px] overflow-y-auto shadow-2xl border border-slate-700">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-white text-lg font-semibold">
                    Thành viên nhóm
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {selectedGroup?.name}{" "}
                    <span className="text-indigo-300 font-medium">
                      · {viewMembersLoading ? "…" : viewMembersList.length}{" "}
                      người
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowViewMembersModal(false)}
                  className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  ✕
                </button>
              </div>

              {viewMembersLoading ? (
                <div className="text-slate-400 text-sm py-8 text-center">
                  Đang tải danh sách…
                </div>
              ) : viewMembersList.length === 0 ? (
                <div className="text-slate-400 text-sm py-6">
                  Không có dữ liệu thành viên
                </div>
              ) : (
                <ul className="space-y-2">
                  {viewMembersList.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/40 border border-slate-700/50"
                    >
                      <img
                        src={resolveAvatar(member?.avatar)}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                        className="w-10 h-10 rounded-full object-cover bg-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                          {member.username}
                          {Number(member.id) === Number(currentUserId) && (
                            <span className="text-slate-500 font-normal text-xs ml-1">
                              (bạn)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {memberRoleLabel(member.role)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewMembersModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="bg-slate-800 p-4 rounded-xl w-[420px] max-h-[520px] overflow-y-auto">
              <h3 className="text-white mb-3">Thêm thành viên vào nhóm</h3>

              {friendCandidates.length === 0 ? (
                <div className="text-slate-400 text-sm">
                  Chưa có bạn bè để thêm
                </div>
              ) : (
                <div className="space-y-2">
                  {friendCandidates.map((friend, index) => {
                    const friendId = getFriendId(friend);
                    const checked = selectedMemberIds.includes(friendId);
                    return (
                      <label
                        key={friendId || index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectMember(friend)}
                        />
                        <img
                          src={resolveAvatar(friend?.avatar)}
                          alt={getFriendName(friend)}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                          className="w-9 h-9 rounded-full object-cover bg-slate-700"
                        />
                        <span className="text-white">
                          {getFriendName(friend)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleAddMembersToGroup}
                  disabled={selectedMemberIds.length === 0}
                  className="px-3 py-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {showRemoveMemberModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="bg-slate-800 p-4 rounded-xl w-[420px] max-h-[520px] overflow-y-auto">
              <h3 className="text-white mb-3">Xoá thành viên khỏi nhóm</h3>

              {memberCandidates.length === 0 ? (
                <div className="text-slate-400 text-sm">
                  Không có thành viên để xoá
                </div>
              ) : (
                <div className="space-y-2">
                  {memberCandidates.map((member, index) => {
                    const memberId = getFriendId(member);
                    const checked = selectedMemberIds.includes(memberId);

                    return (
                      <label
                        key={memberId || index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectMember(member)}
                        />
                        <img
                          src={resolveAvatar(member?.avatar)}
                          alt={getFriendName(member)}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                          className="w-9 h-9 rounded-full object-cover bg-slate-700"
                        />
                        <span className="text-white">
                          {getFriendName(member)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowRemoveMemberModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleRemoveMembersFromGroup}
                  disabled={selectedMemberIds.length === 0}
                  className="px-3 py-2 rounded-lg bg-red-500 text-white disabled:opacity-50"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        )}

        {showUpdateRoleModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="bg-slate-800 p-4 rounded-xl w-[420px] max-h-[520px] overflow-y-auto">
              <h3 className="text-white mb-3">Cập nhật quyền thành viên</h3>

              {roleCandidates.length === 0 ? (
                <div className="text-slate-400 text-sm">
                  Không có thành viên phù hợp để cập nhật quyền
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {roleCandidates.map((member, index) => (
                      <label
                        key={member.id || index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="update-role-user"
                          checked={selectedRoleUserId === member.id}
                          onChange={() => {
                            setSelectedRoleUserId(member.id);
                            setSelectedRoleValue(member.role || "MEMBER");
                          }}
                        />
                        <img
                          src={resolveAvatar(member?.avatar)}
                          alt={getFriendName(member)}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                          className="w-9 h-9 rounded-full object-cover bg-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white truncate">
                            {getFriendName(member)}
                          </div>
                          <div className="text-xs text-slate-400">
                            Quyền hiện tại: {member.role}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="text-slate-300 text-sm mb-1 block">
                      Quyền mới
                    </label>
                    <select
                      value={selectedRoleValue}
                      onChange={(e) => setSelectedRoleValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 outline-none"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowUpdateRoleModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={!selectedRoleUserId}
                  className="px-3 py-2 rounded-lg bg-violet-500 text-white disabled:opacity-50"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}

        {callModal && (
          <CallModal
            {...callModal}
            onClose={() => setCallModal(null)}
          />
        )}

        {(showProfile || showChangePassword) && (
          <div className="fixed inset-0 flex items-center justify-center z-[999]">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setShowProfile(false);
                setShowChangePassword(false);
              }}
            ></div>

            <div className="relative z-[1000] shadow-2xl">
              {showProfile && (
                <ProfileModal
                  onClose={() => setShowProfile(false)}
                  refreshUser={fetchUser}
                />
              )}
              {showChangePassword && (
                <ChangePasswordModal
                  onClose={() => setShowChangePassword(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  export default ChatPage;
