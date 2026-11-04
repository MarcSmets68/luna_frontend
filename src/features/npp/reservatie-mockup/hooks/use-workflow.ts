"use client";

import { useReducer } from "react";
import { createInitialState, workflowReducer } from "../reducer";

export function useWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, undefined, createInitialState);
  return { state, dispatch };
}
