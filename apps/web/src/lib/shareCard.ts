// Canvas-based share card generator — no external dependencies.
// Posts/comments: white card over dark branded background, portrait format.
// Profile: white card mirroring the profile header layout.

const CANVAS_W = 1080;
const CARD_X = 60;
const CARD_Y = 80;
const CARD_W = CANVAS_W - CARD_X * 2; // 960
const CARD_PAD = 44;
const CARD_INNER_W = CARD_W - CARD_PAD * 2; // 872
const INNER_X = CARD_X + CARD_PAD; // 104
const INNER_RIGHT = CARD_X + CARD_W - CARD_PAD; // 976

const IVORY = "#fffef5";
const DEEP_PURPLE = "#1a0d48";
const INDIGO = "#6b3dd4";
const PEAR = "#b5cc35";
const MUTED = "rgba(26,13,72,0.48)";

const CONTENT_FS = 36;        // font-size for post/comment content
const CONTENT_LH = 58;        // line-height
const CONTENT_MAX = 10;       // max lines
const COVER_W = 80;           // book cover width
const COVER_H = 120;          // book cover height
const COVER_GAP = 16;         // gap between cover and text
const AUTHOR_H = 72;          // height of author row

// ── Background ─────────────────────────────────────────────────────────────

function drawMidnightBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.4, h);
  grad.addColorStop(0, "#18093f");
  grad.addColorStop(1, "#301a70");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(-80, -80, 340, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(181,204,53,0.12)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w + 60, h + 60, 300, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(155,110,232,0.18)";
  ctx.fill();
}

// ── Image loading ──────────────────────────────────────────────────────────

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // Cache-bust to avoid getting a cached non-CORS response from the <img> tag
    img.src = url.includes("?") ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;
  });
}

// ── Text helpers ───────────────────────────────────────────────────────────

function getLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(" ").filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxW: number,
  lineH: number,
  maxLines: number,
  align: CanvasTextAlign = "left"
): number {
  ctx.textAlign = align;
  const all = getLines(ctx, text, maxW);
  const truncated = all.length > maxLines;
  const lines = all.slice(0, maxLines);
  let y = startY;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (truncated && i === lines.length - 1) {
      while (ctx.measureText(line + "…").width > maxW && line.length > 0) {
        line = line.trimEnd().slice(0, -1);
      }
      line += "…";
    }
    ctx.fillText(line, x, y);
    y += lineH;
  }
  ctx.textAlign = "left";
  return y;
}

// ── Avatar (image with initials fallback) ──────────────────────────────────

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  initial: string,
  cx: number,
  cy: number,
  r: number,
  isDark: boolean
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = isDark ? "rgba(181,204,53,0.22)" : "rgba(107,61,212,0.1)";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = isDark ? PEAR : INDIGO;
    ctx.font = `700 ${Math.round(r * 0.85)}px 'Zalando Sans SemiExpanded', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial.toUpperCase(), cx, cy);
  }
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

// ── Brand footer (below the card) ─────────────────────────────────────────

function drawBrandBelow(ctx: CanvasRenderingContext2D, cardBottomY: number) {
  const y = cardBottomY + 44;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PEAR;
  ctx.font = `600 26px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.fillText("BookTalk", CANVAS_W / 2, y);
  ctx.fillRect(CANVAS_W / 2 - 38, y + 10, 76, 3);
}

// ── Download ───────────────────────────────────────────────────────────────

function triggerDownload(canvas: HTMLCanvasElement, filename: string) {
  try {
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  } catch {
    // silently skip if canvas is tainted by cross-origin content
  }
}

// ── Measure content block height ───────────────────────────────────────────

function measureContentH(
  ctx: CanvasRenderingContext2D,
  content: string,
  hasSpoilers: boolean,
  hasCover: boolean,
  hasPill: boolean
): number {
  if (hasSpoilers) return CONTENT_FS + 28;

  const textW = hasCover ? CARD_INNER_W - COVER_W - COVER_GAP : CARD_INNER_W;
  ctx.font = `400 ${CONTENT_FS}px 'Lora', Georgia, serif`;
  const lines = getLines(ctx, content, textW);
  const textH = Math.min(lines.length, CONTENT_MAX) * CONTENT_LH;

  let total = 0;
  // pill: 44px + 14px gap + CONTENT_FS (so text baseline clears the pill)
  if (hasPill) total += 44 + 14 + CONTENT_FS;
  if (hasCover) total += Math.max(COVER_H, textH + 20 + 26); // 20 gap + 26 label height
  else total += textH;
  return total;
}

// ── Post / Comment card ────────────────────────────────────────────────────

async function drawPostOrCommentCard(opts: {
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  content: string;
  hasSpoilers?: boolean;
  likeCount: number;
  actionRightLabel: string;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  bookCoverUrl?: string | null;
  gifUrl?: string | null;
  filename: string;
}): Promise<void> {
  await document.fonts.ready;

  const hasSpoilers = opts.hasSpoilers ?? false;
  const hasCover = !!opts.bookCoverUrl;
  const hasPill = !hasCover && !!opts.bookTitle;

  // Load GIF early so we know its dimensions for card height calculation
  const gifImg = opts.gifUrl ? await loadImage(opts.gifUrl) : null;
  const GIF_MAX_W = CARD_INNER_W;
  const GIF_MAX_H = 400;
  let gifDrawW = 0, gifDrawH = 0;
  if (gifImg) {
    const scale = Math.min(GIF_MAX_W / gifImg.naturalWidth, GIF_MAX_H / gifImg.naturalHeight, 1);
    gifDrawW = Math.round(gifImg.naturalWidth * scale);
    gifDrawH = Math.round(gifImg.naturalHeight * scale);
  }

  // Measure using temp canvas
  const tmp = document.createElement("canvas");
  tmp.width = CANVAS_W; tmp.height = 200;
  const contentH = measureContentH(tmp.getContext("2d")!, opts.content, hasSpoilers, hasCover, hasPill);

  // Card height (no separator lines)
  const GAP = 32; // gap between author and content, and between content and action bar
  const ACTION_H = 36;
  const gifBlockH = gifDrawH > 0 ? GAP + gifDrawH : 0;
  const cardH = CARD_PAD + AUTHOR_H + GAP + contentH + gifBlockH + GAP + ACTION_H + CARD_PAD;
  const canvasH = Math.max(CARD_Y + cardH + 80, 600);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  drawMidnightBg(ctx, CANVAS_W, canvasH);
  drawBrandBelow(ctx, CARD_Y + cardH);

  // Card shadow + background
  ctx.save();
  ctx.shadowColor = "rgba(10,0,40,0.45)";
  ctx.shadowBlur = 52;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = IVORY;
  ctx.beginPath();
  ctx.roundRect(CARD_X, CARD_Y, CARD_W, cardH, 20);
  ctx.fill();
  ctx.restore();

  // ── Author row ──
  const avatarR = 34;
  const avatarCX = INNER_X + avatarR;
  const avatarCY = CARD_Y + CARD_PAD + avatarR;
  const avatarImg = opts.authorAvatarUrl ? await loadImage(opts.authorAvatarUrl) : null;
  drawAvatar(ctx, avatarImg, opts.authorDisplayName[0], avatarCX, avatarCY, avatarR, false);

  const nameX = INNER_X + avatarR * 2 + 18;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = DEEP_PURPLE;
  ctx.font = `600 36px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.fillText(opts.authorDisplayName, nameX, CARD_Y + CARD_PAD + 28);
  ctx.fillStyle = MUTED;
  ctx.font = `400 27px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.fillText(`@${opts.authorUsername}`, nameX, CARD_Y + CARD_PAD + 63);

  // ── Content ──
  const contentStartY = CARD_Y + CARD_PAD + AUTHOR_H + GAP;

  if (hasSpoilers) {
    ctx.fillStyle = "rgba(26,13,72,0.05)";
    ctx.beginPath();
    ctx.roundRect(INNER_X, contentStartY, CARD_INNER_W, CONTENT_FS + 28, 8);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.font = `italic 30px 'Lora', Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("This post contains spoilers", CARD_X + CARD_W / 2, contentStartY + (CONTENT_FS + 28) / 2);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  } else {
    let coverImg: HTMLImageElement | null = null;
    if (opts.bookCoverUrl) coverImg = await loadImage(opts.bookCoverUrl);

    // textX / textW: shift right when cover is present
    const textX = hasCover ? INNER_X + COVER_W + COVER_GAP : INNER_X;
    const textW = hasCover ? CARD_INNER_W - COVER_W - COVER_GAP : CARD_INNER_W;

    if (hasCover) {
      // Book cover image or placeholder
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(INNER_X, contentStartY, COVER_W, COVER_H, 4);
      ctx.clip();
      if (coverImg) {
        ctx.drawImage(coverImg, INNER_X, contentStartY, COVER_W, COVER_H);
      } else {
        ctx.fillStyle = "rgba(107,61,212,0.12)";
        ctx.fillRect(INNER_X, contentStartY, COVER_W, COVER_H);
        ctx.fillStyle = INDIGO;
        ctx.font = `700 26px 'Zalando Sans SemiExpanded', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((opts.bookTitle ?? "?")[0].toUpperCase(), INNER_X + COVER_W / 2, contentStartY + COVER_H / 2);
        ctx.textBaseline = "alphabetic";
      }
      ctx.restore();

    } else if (hasPill && opts.bookTitle) {
      // Book pill — draw at contentStartY, text baseline below pill
      const bookText = opts.bookAuthor
        ? `${opts.bookTitle}  ·  ${opts.bookAuthor}`
        : opts.bookTitle;
      ctx.font = `400 25px 'Zalando Sans SemiExpanded', sans-serif`;
      const pillW = Math.min(ctx.measureText(bookText).width + 44, CARD_INNER_W);
      ctx.fillStyle = "rgba(181,204,53,0.65)";
      ctx.beginPath();
      ctx.roundRect(INNER_X, contentStartY, pillW, 44, 8);
      ctx.fill();
      ctx.fillStyle = DEEP_PURPLE;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(bookText, INNER_X + 18, contentStartY + 22);
      ctx.textBaseline = "alphabetic";
    }

    // Content text — baseline starts below pill (pill height + gap + font ascent)
    const textBaselineY = hasPill
      ? contentStartY + 44 + 14 + CONTENT_FS   // clear the pill visually
      : contentStartY + CONTENT_FS;             // normal: first baseline = contentStartY + ascent

    ctx.fillStyle = DEEP_PURPLE;
    ctx.font = `400 ${CONTENT_FS}px 'Lora', Georgia, serif`;
    ctx.textAlign = "left";
    const textEndY = drawWrapped(ctx, opts.content, textX, textBaselineY, textW, CONTENT_LH, CONTENT_MAX);

    // Book label — rendered right below the text, not pinned to cover bottom
    if (hasCover && (opts.bookTitle || opts.bookAuthor)) {
      const label = [opts.bookTitle, opts.bookAuthor].filter(Boolean).join("  ·  ");
      ctx.fillStyle = MUTED;
      ctx.font = `400 22px 'Zalando Sans SemiExpanded', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(label, textX, textEndY + 20);
    }
  }

  // ── GIF ──
  if (gifImg && gifDrawW > 0) {
    const gifY = CARD_Y + CARD_PAD + AUTHOR_H + GAP + contentH + GAP;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(INNER_X, gifY, gifDrawW, gifDrawH, 8);
    ctx.clip();
    ctx.drawImage(gifImg, INNER_X, gifY, gifDrawW, gifDrawH);
    ctx.restore();
  }

  // ── Action bar ──
  const actionY = CARD_Y + cardH - CARD_PAD - 8;
  ctx.fillStyle = MUTED;
  ctx.font = `400 26px 'Zalando Sans SemiExpanded', sans-serif`;
  const leftLabel = opts.actionRightLabel
    ? `${opts.likeCount} likes  ·  ${opts.actionRightLabel}`
    : `${opts.likeCount} likes`;
  ctx.textAlign = "left";
  ctx.fillText(leftLabel, INNER_X, actionY);
  ctx.textAlign = "right";
  ctx.fillText("booktalksocial.com", INNER_RIGHT, actionY);

  triggerDownload(canvas, opts.filename);
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface PostShareData {
  content: string;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  likeCount: number;
  commentCount: number;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  bookCoverUrl?: string | null;
  gifUrl?: string | null;
  hasSpoilers?: boolean;
}

export async function sharePost(data: PostShareData): Promise<void> {
  await drawPostOrCommentCard({
    authorDisplayName: data.authorDisplayName,
    authorUsername: data.authorUsername,
    authorAvatarUrl: data.authorAvatarUrl,
    content: data.content,
    hasSpoilers: data.hasSpoilers,
    likeCount: data.likeCount,
    actionRightLabel: `${data.commentCount} comments`,
    bookTitle: data.bookTitle,
    bookAuthor: data.bookAuthor,
    bookCoverUrl: data.bookCoverUrl,
    gifUrl: data.gifUrl,
    filename: "booktalk-post.png",
  });
}

export interface CommentShareData {
  content: string;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  likeCount: number;
}

export async function shareComment(data: CommentShareData): Promise<void> {
  await drawPostOrCommentCard({
    authorDisplayName: data.authorDisplayName,
    authorUsername: data.authorUsername,
    authorAvatarUrl: data.authorAvatarUrl,
    content: data.content,
    hasSpoilers: false,
    likeCount: data.likeCount,
    actionRightLabel: "",
    filename: "booktalk-comment.png",
  });
}

export interface ProfileShareData {
  displayName: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  followersCount: number;
  followingCount: number;
}

// Profile card mirrors the actual profile header: avatar left, info right, bio below.
export async function shareProfile(data: ProfileShareData): Promise<void> {
  await document.fonts.ready;

  // Measure bio lines to compute card height
  const tmp = document.createElement("canvas");
  tmp.width = CANVAS_W; tmp.height = 200;
  const tmpCtx = tmp.getContext("2d")!;
  const BIO_FS = 32;
  const BIO_LH = 52;
  const BIO_MAX = 4;
  const bioLines = data.bio?.trim()
    ? Math.min(getLines(tmpCtx, data.bio, CARD_INNER_W).length, BIO_MAX)
    : 0;

  // Row: avatar (r=90 → 180px tall) and info column side by side
  const AVATAR_R = 90;
  const AVATAR_DIAM = AVATAR_R * 2; // 180
  const INFO_X = INNER_X + AVATAR_DIAM + 52;
  const INFO_W = INNER_RIGHT - INFO_X;

  // Info column heights: name(52) + 14gap + handle(32) + 22gap + stat(44) + 8 + statLabel(26) = 198
  const ROW_H = Math.max(AVATAR_DIAM, 198);

  const URL_H = 24 + 26; // 24 gap above URL + 26 font size
  const cardH =
    CARD_PAD +
    ROW_H +
    (bioLines > 0 ? 28 + bioLines * BIO_LH : 0) +
    URL_H +
    CARD_PAD;

  const canvasH = Math.max(CARD_Y + cardH + 80, 660);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  drawMidnightBg(ctx, CANVAS_W, canvasH);
  drawBrandBelow(ctx, CARD_Y + cardH);

  // Card shadow + background
  ctx.save();
  ctx.shadowColor = "rgba(10,0,40,0.45)";
  ctx.shadowBlur = 52;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = IVORY;
  ctx.beginPath();
  ctx.roundRect(CARD_X, CARD_Y, CARD_W, cardH, 20);
  ctx.fill();
  ctx.restore();

  // ── Avatar ──
  const avatarCX = INNER_X + AVATAR_R;
  const avatarCY = CARD_Y + CARD_PAD + AVATAR_R;
  const avatarImg = data.avatarUrl ? await loadImage(data.avatarUrl) : null;
  drawAvatar(ctx, avatarImg, data.displayName[0], avatarCX, avatarCY, AVATAR_R, false);

  // ── Info column ──
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Display name — adaptive font size
  let nameSize = 52;
  ctx.font = `700 ${nameSize}px 'Zalando Sans SemiExpanded', sans-serif`;
  while (ctx.measureText(data.displayName).width > INFO_W && nameSize > 22) {
    nameSize -= 4;
    ctx.font = `700 ${nameSize}px 'Zalando Sans SemiExpanded', sans-serif`;
  }
  const nameBaselineY = CARD_Y + CARD_PAD + nameSize;
  ctx.fillStyle = DEEP_PURPLE;
  ctx.fillText(data.displayName, INFO_X, nameBaselineY);

  // @username
  const handleY = nameBaselineY + 14 + 32;
  ctx.fillStyle = MUTED;
  ctx.font = `400 32px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.fillText(`@${data.username}`, INFO_X, handleY);

  // Follower / following stats
  const statCountY = handleY + 22 + 44;
  const statLabelY = statCountY + 8 + 26;
  const STAT_GAP = 160;

  ctx.fillStyle = DEEP_PURPLE;
  ctx.font = `700 44px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.fillText(String(data.followersCount), INFO_X, statCountY);
  ctx.fillText(String(data.followingCount), INFO_X + STAT_GAP, statCountY);

  ctx.fillStyle = MUTED;
  ctx.font = `400 26px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.fillText("followers", INFO_X, statLabelY);
  ctx.fillText("following", INFO_X + STAT_GAP, statLabelY);

  // ── Bio ──
  if (bioLines > 0 && data.bio?.trim()) {
    const bioStartY = CARD_Y + CARD_PAD + ROW_H + 28 + BIO_FS;
    ctx.fillStyle = DEEP_PURPLE;
    ctx.font = `400 ${BIO_FS}px 'Lora', Georgia, serif`;
    drawWrapped(ctx, data.bio, INFO_X, bioStartY, INNER_RIGHT - INFO_X, BIO_LH, BIO_MAX);
  }

  // ── Profile URL ──
  const urlY = CARD_Y + cardH - CARD_PAD - 4;
  ctx.fillStyle = MUTED;
  ctx.font = `400 26px 'Zalando Sans SemiExpanded', sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(`booktalksocial.com/${data.username}`, INNER_RIGHT, urlY);

  triggerDownload(canvas, `booktalk-${data.username}.png`);
}
