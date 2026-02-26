import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSidebarOpen: boolean;
  isSimulationSheetOpen: boolean;
  activeStep: number;
}

const initialState: UiState = {
  isSidebarOpen: true,
  isSimulationSheetOpen: false,
  activeStep: 1,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSimulationSheet: (state, action: PayloadAction<boolean>) => {
      state.isSimulationSheetOpen = action.payload;
    },
    setStep: (state, action: PayloadAction<number>) => {
      state.activeStep = action.payload;
    },
  },
});

export const { toggleSidebar, setSimulationSheet, setStep } = uiSlice.actions;
export default uiSlice.reducer;