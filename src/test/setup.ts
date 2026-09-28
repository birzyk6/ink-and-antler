import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// @testing-library/react's auto-cleanup relies on jest/vitest globals being
// installed on globalThis; this project runs without `test.globals`, so wire
// it up explicitly to unmount between tests.
afterEach(cleanup);
