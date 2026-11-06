import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { strings } from '@/i18n';

export type PhotoSource = 'camera' | 'library';

type PickOptions = {
  source: PhotoSource;
  /** Longest side of the saved image, in pixels. */
  maxSize: number;
  /** Crop to a square (for profile pictures). */
  square?: boolean;
};

/**
 * Lets the user take or choose a photo, then shrinks it to a small JPEG data URI so it can be
 * saved with the rest of the data and synced to the family. Returns null if cancelled.
 */
export async function pickPhoto({ source, maxSize, square }: PickOptions): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error(strings().common.cameraPermission);
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const landscape = asset.width >= asset.height;
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > maxSize) {
    context.resize(landscape ? { width: maxSize } : { height: maxSize });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  if (!saved.base64) return null;
  return `data:image/jpeg;base64,${saved.base64}`;
}
