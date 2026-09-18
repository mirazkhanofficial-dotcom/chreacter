export type SkeletonPointName =
  | 'head'
  | 'neck'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHand'
  | 'rightHand'
  | 'spineTop'
  | 'spineUpper'
  | 'spineMiddle'
  | 'spineLower'
  | 'spineBottom'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle'
  | 'leftFoot'
  | 'rightFoot';

export interface SkeletonPoint {
  x: number;
  y: number;
}

export const ORIGINAL_SKELETON_POINTS: Record<SkeletonPointName, SkeletonPoint> = {
  head: { x: 190, y: 45 },
  neck: { x: 185, y: 92 },
  leftShoulder: { x: 105, y: 115 },
  rightShoulder: { x: 275, y: 105 },
  leftElbow: { x: 92, y: 220 },
  rightElbow: { x: 292, y: 215 },
  leftWrist: { x: 82, y: 330 },
  rightWrist: { x: 305, y: 325 },
  leftHand: { x: 80, y: 385 },
  rightHand: { x: 310, y: 375 },
  spineTop: { x: 183, y: 145 },
  spineUpper: { x: 181, y: 195 },
  spineMiddle: { x: 178, y: 245 },
  spineLower: { x: 175, y: 295 },
  spineBottom: { x: 172, y: 345 },
  leftHip: { x: 140, y: 350 },
  rightHip: { x: 230, y: 340 },
  leftKnee: { x: 135, y: 505 },
  rightKnee: { x: 240, y: 495 },
  leftAnkle: { x: 130, y: 675 },
  rightAnkle: { x: 245, y: 670 },
  // Both feet point forward in the same 3/4 direction instead of splaying apart.
  leftFoot: { x: 158, y: 735 },
  rightFoot: { x: 273, y: 725 },
};

export const SKELETON_CONNECTIONS: Array<[SkeletonPointName, SkeletonPointName]> = [
  ['head', 'neck'],
  ['neck', 'spineTop'],
  ['spineTop', 'spineUpper'],
  ['spineUpper', 'spineMiddle'],
  ['spineMiddle', 'spineLower'],
  ['spineLower', 'spineBottom'],
  ['neck', 'leftShoulder'],
  ['neck', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['leftWrist', 'leftHand'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['rightWrist', 'rightHand'],
  ['spineBottom', 'leftHip'],
  ['spineBottom', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['leftAnkle', 'leftFoot'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
  ['rightAnkle', 'rightFoot'],
];

export const SKELETON_POINT_LABELS: Record<SkeletonPointName, string> = {
  head: '0 Head',
  neck: '1 Neck',
  leftShoulder: '2 L Shoulder',
  rightShoulder: '3 R Shoulder',
  leftElbow: '4 L Elbow',
  rightElbow: '5 R Elbow',
  leftWrist: '6 L Wrist',
  rightWrist: '7 R Wrist',
  leftHand: '8 L Hand',
  rightHand: '9 R Hand',
  spineTop: '10 Spine Top',
  spineUpper: '10 Spine',
  spineMiddle: '10 Spine',
  spineLower: '10 Spine',
  spineBottom: '10 Spine',
  leftHip: '11 L Hip',
  rightHip: '12 R Hip',
  leftKnee: '13 L Knee',
  rightKnee: '14 R Knee',
  leftAnkle: '15 L Ankle',
  rightAnkle: '16 R Ankle',
  leftFoot: '17 L Foot',
  rightFoot: '18 R Foot',
};

export function scaleSkeletonPoint(point: SkeletonPoint, width: number, height: number): SkeletonPoint {
  return {
    x: (point.x / 320) * width,
    y: (point.y / 800) * height,
  };
}
