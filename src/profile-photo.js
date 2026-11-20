  function loadImg(file) {
    return new Promise((res, rej) => { const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => res({ img, url }); img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("не картинка")); }; img.src = url; });
  }
  function squareJpeg(img, S, q0, maxLen) {
    const c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    const m = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - m) / 2, sy = (img.naturalHeight - m) / 2;
    g.fillStyle = "#fff"; g.fillRect(0, 0, S, S); g.drawImage(img, sx, sy, m, m, 0, 0, S, S);
    let q = q0, d = c.toDataURL("image/jpeg", q); while (d.length > maxLen && q > 0.45) { q -= 0.07; d = c.toDataURL("image/jpeg", q); }
    return d;
  }
  // три размера: 256 px — аватарки (чётко на экранах ×3), 1080 px — фото крупно, 112 px — глобус (правило ≤ 20 000)
  async function shrinkPhoto(file) {
    const { img, url } = await loadImg(file);
    try {
      const m = Math.min(img.naturalWidth, img.naturalHeight);
      return { thumb: squareJpeg(img, Math.min(256, m), 0.9, 45000), big: squareJpeg(img, Math.min(1080, m), 0.9, 420000), small: squareJpeg(img, Math.min(112, m), 0.85, 19000) };
    } finally { URL.revokeObjectURL(url); }
  }

export {shrinkPhoto};
