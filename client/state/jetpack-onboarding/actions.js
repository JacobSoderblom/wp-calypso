/** @format */

/**
 * Internal dependencies
 */
import {
	JETPACK_ONBOARDING_CREDENTIALS_RECEIVE,
	JETPACK_ONBOARDING_SETTINGS_RECEIVE,
	JETPACK_ONBOARDING_SETTINGS_SAVE,
} from 'state/action-types';

export const receiveJetpackOnboardingCredentials = ( siteId, credentials ) => ( {
	type: JETPACK_ONBOARDING_CREDENTIALS_RECEIVE,
	siteId,
	credentials,
} );

export const addSettings = ( siteId, settings ) => ( {
	type: JETPACK_ONBOARDING_SETTINGS_RECEIVE,
	siteId,
	settings,
} );

export const saveJetpackOnboardingSettings = ( siteId, settings ) => ( {
	type: JETPACK_ONBOARDING_SETTINGS_SAVE,
	siteId,
	settings,
} );
