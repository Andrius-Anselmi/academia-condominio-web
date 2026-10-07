// Fotos do perfil e dos treinos.
// Por enquanto ficam no localStorage do aparelho (redimensionadas para ~100 KB).
// Quando quiser que sigam o usuário entre aparelhos, troque só estas 3 funções
// por upload no Supabase Storage / Firebase Storage — a tela não muda.

const MAX_SIDE = 900;

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

export function getPhoto(key) {
  try {
    return localStorage.getItem(`photo:${key}`);
  } catch {
    return null;
  }
}

export async function savePhoto(key, file) {
  const data = await resizeImage(file);
  try {
    localStorage.setItem(`photo:${key}`, data);
  } catch {
    throw new Error("Sem espaço para guardar a foto. Remova alguma antiga.");
  }
  return data;
}

export function removePhoto(key) {
  try {
    localStorage.removeItem(`photo:${key}`);
  } catch {
    /* ignora */
  }
}

// Salva uma imagem que já foi recortada (dataURL), sem redimensionar de novo.
export function savePhotoData(key, dataUrl) {
  try {
    localStorage.setItem(`photo:${key}`, dataUrl);
  } catch {
    throw new Error("Sem espaço para guardar a foto.");
  }
  return dataUrl;
}
