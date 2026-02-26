import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PolicyState {
  currentPolicyId: string | null; // The ID from Step 1 needed for all child records
  activeStep: number;            // Tracks progress through the 6-step flow
  activeTabId: string | null;    // Tracks which tab is currently being viewed in Step 2-4
}

const initialState: PolicyState = {
  currentPolicyId: null,
  activeStep: 1,
  activeTabId: null,
};

const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    // Call this after Step 1 (Policy Creation) is successful
    setPolicyId: (state, action: PayloadAction<string>) => {
      state.currentPolicyId = action.payload;
    },

    // Used to move between the 6 steps of the builder
    setStep: (state, action: PayloadAction<number>) => {
      state.activeStep = action.payload;
    },

    // Used in Phase 3 to track which Tab the user is adding SubTabs/Fields to
    setActiveTabId: (state, action: PayloadAction<string | null>) => {
      state.activeTabId = action.payload;
    },

    // Clears state when a policy is submitted or the user starts a new one
    resetPolicyState: (state) => {
      state.currentPolicyId = null;
      state.activeStep = 1;
      state.activeTabId = null;
    }
  },
});

export const { 
  setPolicyId, 
  setStep, 
  setActiveTabId, 
  resetPolicyState 
} = policySlice.actions;

export default policySlice.reducer;