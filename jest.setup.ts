jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs before imports
  const React = require('react') as typeof import('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs before imports
  const { View } = require('react-native') as typeof import('react-native');
  const CameraView = React.forwardRef((_props: object, ref: React.Ref<{ takePictureAsync: () => Promise<{ uri: string }> }>) => {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: async () => ({ uri: 'file:///cache/shot.jpg' }),
    }));
    return React.createElement(View, { testID: 'camera-view' });
  });
  CameraView.displayName = 'CameraView';
  return {
    CameraView,
    useCameraPermissions: () => [{ granted: true, canAskAgain: true, expires: 'never', status: 'granted' }, jest.fn(), jest.fn()],
  };
});
