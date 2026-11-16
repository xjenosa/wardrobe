jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

/* One camera for every test. `mockCamera` is what a test changes: the
   permission the hook reports, the answer to asking, and the shot. */
jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs before imports
  const React = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs before imports
  const { View } = require('react-native') as typeof import('react-native');
  const granted = { granted: true, canAskAgain: true, expires: 'never', status: 'granted' };
  const mockCamera = {
    granted,
    permission: granted,
    requestPermission: jest.fn(),
    takePictureAsync: jest.fn(),
  };
  const CameraView = React.forwardRef((_props: object, ref: React.Ref<{ takePictureAsync: (...a: unknown[]) => unknown }>) => {
    React.useImperativeHandle(ref, () => ({ takePictureAsync: (...a: unknown[]) => mockCamera.takePictureAsync(...a) }));
    return React.createElement(View, { testID: 'camera-view' });
  });
  CameraView.displayName = 'CameraView';
  return {
    CameraView,
    useCameraPermissions: () => [mockCamera.permission, mockCamera.requestPermission, jest.fn()],
    mockCamera,
  };
});
