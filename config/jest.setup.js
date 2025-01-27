import * as JestMock from "jest-fetch-mock";

JestMock.enableMocks();

const realWarn = console.warn;

const ignoreLines = //;

console.error = (...props) => {
    //dont show act messages. They're annoying
    // if (!ignoreLines.test(props[0])) {
    //     realWarn(...props);
    // }
}
console.warn = console.error;

//antd fails when running jest. This is needed
//https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });