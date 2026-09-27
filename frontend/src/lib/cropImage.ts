export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/**
 * Crops an image given pixel coordinates from react-easy-crop and returns a new File.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  originalFilename: string,
  mimeType: string = "image/jpeg"
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas context");
  }

  // Ensure guaranteed 1:1 square dimensions at 100% native resolution
  const squareDim = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = squareDim;
  canvas.height = squareDim;

  // Draw the cropped portion from the original image at full resolution
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    squareDim,
    squareDim,
    0,
    0,
    squareDim,
    squareDim
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas crop failed"));
          return;
        }
        // Normalize filename extension if needed
        const ext = mimeType === "image/png" ? "png" : "jpg";
        const baseName = originalFilename.replace(/\.[^/.]+$/, "");
        const croppedFile = new File([blob], `${baseName}.${ext}`, {
          type: mimeType,
          lastModified: Date.now(),
        });
        resolve(croppedFile);
      },
      mimeType,
      0.95
    );
  });
}
