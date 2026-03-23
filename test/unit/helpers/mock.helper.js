export const resetMockObject = (mockObject) => {
  Object.values(mockObject).forEach((value) => {
    if (typeof value === "function" && "mockReset" in value) {
      value.mockReset();
    }
  });
};
