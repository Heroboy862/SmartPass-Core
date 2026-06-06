/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Boot and run the modular express and asset server architecture
import "./server/index";

// Export helper utilities directly to ensure complete backwards-compatibility 
// with preexisting automated test suites and modules
export { parseBoardingPassText } from "./server/services/bcbpParser";
export { getCurrencyInfo } from "./server/services/currencyService";
export { getRuleBasedFallbackResponse } from "./server/services/fallbackEngine";
