/** @format */
/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Gridicon from 'gridicons';
import { concat, flowRight, includes } from 'lodash';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import FormattedHeader from 'components/formatted-header';
import HelpButton from './help-button';
import JetpackConnectNotices from './jetpack-connect-notices';
import JetpackInstallStep from './install-step';
import LocaleSuggestions from 'components/locale-suggestions';
import LoggedOutFormLinkItem from 'components/logged-out-form/link-item';
import LoggedOutFormLinks from 'components/logged-out-form/links';
import MainWrapper from './main-wrapper';
import page from 'page';
import SiteUrlInput from './site-url-input';
import { externalRedirect, untrailingslashit } from 'lib/route';
import versionCompare from 'lib/version-compare';
import { addCalypsoEnvQueryArg } from './utils';
import { checkUrl, confirmJetpackInstallStatus, dismissUrl } from 'state/jetpack-connect/actions';
import { FLOW_TYPES } from 'state/jetpack-connect/constants';
import { getConnectingSite, getJetpackSiteByUrl } from 'state/jetpack-connect/selectors';
import { isRequestingSites } from 'state/sites/selectors';
import { recordTracksEvent } from 'state/analytics/actions';
import { retrievePlan } from './persistence-utils';
import { urlToSlug } from 'lib/url';
import {
	JPC_PATH_PLANS,
	MINIMUM_JETPACK_VERSION,
	REMOTE_PATH_ACTIVATE,
	REMOTE_PATH_AUTH,
	REMOTE_PATH_INSTALL,
} from './constants';

export class JetpackConnectMain extends Component {
	static propTypes = {
		locale: PropTypes.string,
		path: PropTypes.string,
		type: PropTypes.oneOf( concat( FLOW_TYPES, false ) ),
		url: PropTypes.string,
	};

	redirecting = false;

	/* eslint-disable indent */
	state = this.props.url
		? {
				currentUrl: this.cleanUrl( this.props.url ),
				shownUrl: this.props.url,
				waitingForSites: false,
			}
		: {
				currentUrl: '',
				shownUrl: '',
				waitingForSites: false,
			};
	/* eslint-enable indent */

	componentWillMount() {
		if ( this.props.url ) {
			this.checkUrl( this.cleanUrl( this.props.url ) );
		}
	}

	componentDidMount() {
		let from = 'direct';
		if ( this.props.type === 'install' ) {
			from = 'jpdotcom';
		}
		if ( this.props.type === 'pro' ) {
			from = 'ad';
		}
		if ( this.props.type === 'premium' ) {
			from = 'ad';
		}
		if ( this.props.type === 'personal' ) {
			from = 'ad';
		}
		this.props.recordTracksEvent( 'calypso_jpc_url_view', {
			jpc_from: from,
		} );
	}

	componentDidUpdate() {
		if (
			this.getStatus() === 'notConnectedJetpack' &&
			this.isCurrentUrlFetched() &&
			! this.redirecting
		) {
			return this.goToRemoteAuth( this.state.currentUrl );
		}
		if ( this.getStatus() === 'alreadyOwned' && ! this.redirecting ) {
			return this.goToPlans( this.state.currentUrl );
		}

		if ( this.state.waitingForSites && ! this.props.isRequestingSites ) {
			// eslint-disable-next-line react/no-did-update-set-state
			this.setState( { waitingForSites: false } );
			this.checkUrl( this.state.currentUrl );
		}
	}

	dismissUrl = () => this.props.dismissUrl( this.state.currentUrl );

	makeSafeRedirectionFunction( func ) {
		return url => {
			if ( ! this.redirecting ) {
				this.redirecting = true;
				func( url );
			}
		};
	}

	goToPlans = this.makeSafeRedirectionFunction( url => {
		this.props.recordTracksEvent( 'calypso_jpc_success_redirect', {
			url: url,
			type: 'plans_selection',
		} );

		page.redirect( `${ JPC_PATH_PLANS }/${ urlToSlug( url ) }` );
	} );

	goToRemoteAuth = this.makeSafeRedirectionFunction( url => {
		this.props.recordTracksEvent( 'calypso_jpc_success_redirect', {
			url: url,
			type: 'remote_auth',
		} );
		externalRedirect( addCalypsoEnvQueryArg( url + REMOTE_PATH_AUTH ) );
	} );

	goToPluginInstall = this.makeSafeRedirectionFunction( url => {
		this.props.recordTracksEvent( 'calypso_jpc_success_redirect', {
			url: url,
			type: 'plugin_install',
		} );

		externalRedirect( addCalypsoEnvQueryArg( url + REMOTE_PATH_INSTALL ) );
	} );

	goToPluginActivation = this.makeSafeRedirectionFunction( url => {
		this.props.recordTracksEvent( 'calypso_jpc_success_redirect', {
			url: url,
			type: 'plugin_activation',
		} );

		externalRedirect( addCalypsoEnvQueryArg( url + REMOTE_PATH_ACTIVATE ) );
	} );

	isCurrentUrlFetched() {
		return (
			this.props.jetpackConnectSite &&
			this.state.currentUrl === this.props.jetpackConnectSite.url &&
			this.props.jetpackConnectSite.isFetched
		);
	}

	isCurrentUrlFetching() {
		return (
			this.state.currentUrl !== '' &&
			this.props.jetpackConnectSite &&
			this.state.currentUrl === this.props.jetpackConnectSite.url &&
			this.props.jetpackConnectSite.isFetching
		);
	}

	handleUrlChange = event => {
		const url = event.target.value;
		this.setState( {
			currentUrl: this.cleanUrl( url ),
			shownUrl: url,
		} );
	};

	cleanUrl( inputUrl ) {
		let url = inputUrl.trim().toLowerCase();
		if ( url && url.substr( 0, 4 ) !== 'http' ) {
			url = 'http://' + url;
		}
		return untrailingslashit( url );
	}

	checkUrl( url ) {
		return this.props.checkUrl( url, !! this.props.getJetpackSiteByUrl( url ) );
	}

	handleUrlSubmit = () => {
		this.props.recordTracksEvent( 'calypso_jpc_url_submit', {
			jetpack_url: this.state.currentUrl,
		} );
		if ( this.props.isRequestingSites ) {
			this.setState( { waitingForSites: true } );
		} else {
			this.checkUrl( this.state.currentUrl );
		}
	};

	installJetpack = () => {
		this.props.recordTracksEvent( 'calypso_jpc_instructions_click', {
			jetpack_funnel: this.state.currentUrl,
			type: 'install_jetpack',
		} );

		this.goToPluginInstall( this.state.currentUrl );
	};

	activateJetpack = () => {
		this.props.recordTracksEvent( 'calypso_jpc_instructions_click', {
			jetpack_funnel: this.state.currentUrl,
			type: 'activate_jetpack',
		} );
		this.goToPluginActivation( this.state.currentUrl );
	};

	checkProperty( propName ) {
		return (
			this.state.currentUrl &&
			this.props.jetpackConnectSite &&
			this.props.jetpackConnectSite.data &&
			this.isCurrentUrlFetched() &&
			this.props.jetpackConnectSite.data[ propName ]
		);
	}

	isRedirecting() {
		return this.props.jetpackConnectSite && this.redirecting && this.isCurrentUrlFetched();
	}

	getStatus() {
		if ( this.state.currentUrl === '' ) {
			return false;
		}

		if ( this.checkProperty( 'userOwnsSite' ) ) {
			return 'alreadyOwned';
		}

		if ( this.props.jetpackConnectSite.installConfirmedByUser === false ) {
			return 'notJetpack';
		}

		if ( this.props.jetpackConnectSite.installConfirmedByUser === true ) {
			return 'notActiveJetpack';
		}

		if (
			this.state.currentUrl.toLowerCase() === 'http://wordpress.com' ||
			this.state.currentUrl.toLowerCase() === 'https://wordpress.com'
		) {
			return 'wordpress.com';
		}
		if ( this.checkProperty( 'isWordPressDotCom' ) ) {
			return 'isDotCom';
		}
		if ( ! this.checkProperty( 'exists' ) ) {
			return 'notExists';
		}
		if ( ! this.checkProperty( 'isWordPress' ) ) {
			return 'notWordPress';
		}
		if ( ! this.checkProperty( 'hasJetpack' ) ) {
			return 'notJetpack';
		}
		const jetpackVersion = this.checkProperty( 'jetpackVersion' );
		if ( jetpackVersion && versionCompare( jetpackVersion, MINIMUM_JETPACK_VERSION, '<' ) ) {
			return 'outdatedJetpack';
		}
		if ( ! this.checkProperty( 'isJetpackActive' ) ) {
			return 'notActiveJetpack';
		}
		if (
			! this.checkProperty( 'isJetpackConnected' ) ||
			( this.checkProperty( 'isJetpackConnected' ) && ! this.checkProperty( 'userOwnsSite' ) )
		) {
			return 'notConnectedJetpack';
		}
		if ( this.checkProperty( 'isJetpackConnected' ) && this.checkProperty( 'userOwnsSite' ) ) {
			return 'alreadyConnected';
		}

		return false;
	}

	handleOnClickTos = () => this.props.recordTracksEvent( 'calypso_jpc_tos_link_click' );

	getTexts() {
		const { type, translate } = this.props;
		const selectedPlan = retrievePlan();

		if (
			type === 'pro' ||
			selectedPlan === 'jetpack_business' ||
			selectedPlan === 'jetpack_business_monthly'
		) {
			return {
				headerTitle: translate( 'Get Jetpack Professional' ),
				headerSubtitle: translate(
					'WordPress sites from start to finish: unlimited premium themes, ' +
						'business class security, and marketing automation.'
				),
			};
		}
		if (
			type === 'premium' ||
			selectedPlan === 'jetpack_premium' ||
			selectedPlan === 'jetpack_premium_monthly'
		) {
			return {
				headerTitle: translate( 'Get Jetpack Premium' ),
				headerSubtitle: translate(
					'Automated backups and malware scanning, expert priority support, ' +
						'marketing automation, and more.'
				),
			};
		}
		if (
			type === 'personal' ||
			selectedPlan === 'jetpack_personal' ||
			selectedPlan === 'jetpack_personal_monthly'
		) {
			return {
				headerTitle: translate( 'Get Jetpack Personal' ),
				headerSubtitle: translate(
					'Security essentials for your WordPress site ' +
						'including automated backups and priority support.'
				),
			};
		}

		if ( type === 'install' ) {
			return {
				headerTitle: translate( 'Install Jetpack' ),
				headerSubtitle: translate(
					'Jetpack brings free themes, security services, and essential marketing tools ' +
						'to your self-hosted WordPress site.'
				),
			};
		}
		return {
			headerTitle: translate( 'Connect a self-hosted WordPress' ),
			headerSubtitle: translate(
				"We'll be installing the Jetpack plugin so WordPress.com can connect to " +
					'your self-hosted WordPress site.'
			),
		};
	}

	isInstall() {
		return includes( FLOW_TYPES, this.props.type );
	}

	getInstructionsData( status ) {
		const { translate } = this.props;
		return {
			headerTitle:
				'notJetpack' === status
					? translate( 'Ready for installation' )
					: translate( 'Ready for activation' ),
			headerSubtitle: translate(
				"We'll need to send you to your site dashboard for a few manual steps."
			),
			steps:
				'notJetpack' === status
					? [ 'installJetpack', 'activateJetpackAfterInstall', 'connectJetpackAfterInstall' ]
					: [ 'activateJetpack', 'connectJetpack' ],
			buttonOnClick: 'notJetpack' === status ? this.installJetpack : this.activateJetpack,
			buttonText:
				'notJetpack' === status ? translate( 'Install Jetpack' ) : translate( 'Activate Jetpack' ),
		};
	}

	renderFooter() {
		const { translate } = this.props;
		return (
			<LoggedOutFormLinks>
				<LoggedOutFormLinkItem href="https://jetpack.com/support/installing-jetpack/">
					{ translate( 'Install Jetpack manually' ) }
				</LoggedOutFormLinkItem>
				{ this.isInstall() ? null : (
					<LoggedOutFormLinkItem href="/start">
						{ translate( 'Start a new site on WordPress.com' ) }
					</LoggedOutFormLinkItem>
				) }
				<HelpButton />
			</LoggedOutFormLinks>
		);
	}

	renderSiteInput( status ) {
		return (
			<Card className="jetpack-connect__site-url-input-container">
				{ ! this.isCurrentUrlFetching() &&
				this.isCurrentUrlFetched() &&
				! this.props.jetpackConnectSite.isDismissed &&
				status ? (
					<JetpackConnectNotices
						noticeType={ status }
						onDismissClick={ this.dismissUrl }
						url={ this.state.currentUrl }
					/>
				) : null }

				<SiteUrlInput
					url={ this.state.shownUrl }
					onTosClick={ this.handleOnClickTos }
					onChange={ this.handleUrlChange }
					onSubmit={ this.handleUrlSubmit }
					isError={ this.getStatus() }
					isFetching={
						this.isCurrentUrlFetching() || this.isRedirecting() || this.state.waitingForSites
					}
					isInstall={ this.isInstall() }
				/>
			</Card>
		);
	}

	renderLocaleSuggestions() {
		if ( this.props.userModule.get() || ! this.props.locale ) {
			return;
		}

		return <LocaleSuggestions path={ this.props.path } locale={ this.props.locale } />;
	}

	renderSiteEntry() {
		const status = this.getStatus();
		return (
			<MainWrapper>
				{ this.renderLocaleSuggestions() }
				<div className="jetpack-connect__site-url-entry-container">
					<FormattedHeader
						headerText={ this.getTexts().headerTitle }
						subHeaderText={ this.getTexts().headerSubtitle }
					/>

					{ this.renderSiteInput( status ) }
					{ this.renderFooter() }
				</div>
			</MainWrapper>
		);
	}

	renderNotJetpackButton() {
		const { translate } = this.props;
		return (
			<a
				className="jetpack-connect__no-jetpack-button"
				href="#"
				onClick={ this.confirmJetpackNotInstalled }
			>
				{ translate( "Don't have jetpack installed?" ) }
			</a>
		);
	}

	renderBackButton() {
		const { translate } = this.props;
		return (
			<Button
				compact
				borderless
				className="jetpack-connect__back-button"
				onClick={ this.dismissUrl }
			>
				<Gridicon icon="arrow-left" size={ 18 } />
				{ translate( 'Back' ) }
			</Button>
		);
	}

	renderInstructions( instructionsData ) {
		const jetpackVersion = this.checkProperty( 'jetpackVersion' ),
			isInstall = this.isInstall(),
			{ currentUrl } = this.state;
		return (
			<MainWrapper isWide>
				{ this.renderLocaleSuggestions() }
				<div className="jetpack-connect__install">
					<FormattedHeader
						headerText={ instructionsData.headerTitle }
						subHeaderText={ instructionsData.headerSubtitle }
					/>
					<div className="jetpack-connect__install-steps">
						{ instructionsData.steps.map( ( stepName, key ) => {
							return (
								<JetpackInstallStep
									key={ 'instructions-step-' + key }
									stepName={ stepName }
									jetpackVersion={ jetpackVersion }
									isInstall={ isInstall }
									currentUrl={ currentUrl }
									confirmJetpackInstallStatus={ this.props.confirmJetpackInstallStatus }
									onClick={ instructionsData.buttonOnClick }
								/>
							);
						} ) }
					</div>
					<Button onClick={ instructionsData.buttonOnClick } primary>
						{ instructionsData.buttonText }
					</Button>
					<div className="jetpack-connect__navigation">{ this.renderBackButton() }</div>
				</div>
				<LoggedOutFormLinks>
					<HelpButton />
				</LoggedOutFormLinks>
			</MainWrapper>
		);
	}

	render() {
		const status = this.getStatus();
		if (
			includes( [ 'notJetpack', 'notActiveJetpack' ], status ) &&
			! this.props.jetpackConnectSite.isDismissed
		) {
			return this.renderInstructions( this.getInstructionsData( status ) );
		}
		return this.renderSiteEntry();
	}
}

const connectComponent = connect(
	state => ( {
		getJetpackSiteByUrl: url => getJetpackSiteByUrl( state, url ),
		isRequestingSites: isRequestingSites( state ),
		jetpackConnectSite: getConnectingSite( state ),
	} ),
	{
		checkUrl,
		confirmJetpackInstallStatus,
		dismissUrl,
		recordTracksEvent,
	}
);

export default flowRight( connectComponent, localize )( JetpackConnectMain );
