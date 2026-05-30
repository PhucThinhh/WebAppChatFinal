const TOXIC_WORDS = [
  "dm",
  "đỹ",
  "đỷ",
  "đỉ",
  "mẹ mày",
  "con mẹ nó",
  "giết",
  "đâm",
  "chém",
  "dmm",
  "đm",
  "đmm",
  "dit",
  "địt",
  "du",
  "đụ",
  "cac",
  "cặc",
  "lon",
  "lồn",
  "buoi",
  "buồi",
  "oc cho",
  "óc chó",
  "cho de",
  "chó đẻ",
  "cho chet",
  "chó chết",
  "do cho",
  "đồ chó",
  "ngu",
  "đần",
  "đéo",
  "deo",
  "cc",
  "cl",
  "vcl",
  "vl",
  "cmm",
  "cmn",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "stupid",
  "idiot",
  "moron",
  "dumb",
];

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function checkToxicMessage(text = "") {
  const raw = String(text || "").trim();

  if (!raw) {
    return {
      toxic: false,
      matches: [],
    };
  }

  const normalized = normalizeText(raw);

  const matches = TOXIC_WORDS.filter((word) => {
    const normalizedWord = normalizeText(word);
    return normalized.includes(normalizedWord);
  });

  return {
    toxic: matches.length > 0,
    matches,
  };
}

export const VIOLATION_MESSAGE =
  "Tin nhắn của bạn bị vi phạm tiêu chuẩn cộng đồng.";
