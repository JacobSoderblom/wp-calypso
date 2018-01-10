/**
 * External dependencies
 *
 * @format
 */

import React, { Fragment } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { jsonStringifyForHtml } from '../../server/sanitize';
import Head from '../components/head';
import Masterbar from '../layout/masterbar/masterbar.jsx';
import getStylesheetUrl from './utils/stylesheet';
// import Badge from 'components/badge';

class Document extends React.Component {
	render() {
		const {
			app,
			chunk,
			faviconURL,
			head,
			i18nLocaleScript,
			initialReduxState,
			isRTL,
			jsFile,
			lang,
			renderedLayout,
			user,
			urls,
			hasSecondary,
			sectionGroup,
			config,
			isFluidWidth,
			shouldUseSingleCDN,
			shouldUsePreconnect,
			shouldUsePreconnectGoogle,
			shouldUseStylePreloadExternal,
			shouldUseStylePreloadSection,
			shouldUseStylePreloadCommon,
			shouldUseScriptPreload,
			sectionCss,
			env,
			isDebug,
			badge,
			abTestHelper,
			branchName,
			commitChecksum,
			devDocs,
			devDocsURL,
			feedbackURL,
		} = this.props;

		return (
			<html
				lang={ lang }
				dir={ isRTL ? 'rtl' : 'ltr' }
				className={ classNames( { 'is-fluid-width': isFluidWidth } ) }
			>
				<Head
					title={ head.title }
					faviconURL={ faviconURL }
					cdn={ shouldUseSingleCDN ? '//s0.wp.com' : '//s1.wp.com' }
				>
					{ head.metas.map( ( { name, property, content } ) => (
						<meta name={ name } property={ property } content={ content } key={ 'meta-' + name } />
					) ) }

					{ head.links.map( ( { rel, href } ) => (
						<link rel={ rel } href={ href } key={ 'link-' + rel + href } />
					) ) }

					<link
						rel="stylesheet"
						id="main-css"
						href={ urls[ getStylesheetUrl( { isRTL, isDebug, env } ) ] }
					/>
					{ sectionCss && (
						<link
							rel="stylesheet"
							id={ 'section-css-' + sectionCss.id }
							href={ get( sectionCss, `urls.${ isRTL ? 'rtl' : 'ltr' }` ) }
						/>
					) }

					{ shouldUsePreconnect && (
						<Fragment>
							{ /*- Preconnect to our CDN hosts */ }
							{ shouldUseSingleCDN ? (
								<link rel="preconnect" href="//s0.wp.com" />
							) : (
								<link rel="preconnect" href="//s1.wp.com" />
							) }

							{ /*- Preconnect to our API */ }
							<link rel="preconnect" href="https://public-api.wordpress.com" />

							{ /*- Preconnect for analytics scripts. */ }
							<link rel="preconnect" href="//stats.wp.com" />
							<link rel="preconnect" href="https://www.google-analytics.com" />

							{ /*- Preconnect for Google domains - especially useful for SSO. */ }
							{ shouldUsePreconnectGoogle && [
								<link rel="preconnect" href="https://google.com" />,
								<link rel="preconnect" href="https://ssl.gstatic.com" />,
								<link rel="preconnect" href="https://apis.google.com" />,
								<link rel="preconnect" href="https://accounts.google.com" />,
								<link rel="preconnect" href="https://stats.g.doubleclick.net" />,
							] }
						</Fragment>
					) }

					{ shouldUseStylePreloadExternal && (
						<Fragment>
							<link
								rel="preload"
								as="style"
								/* eslint-disable max-len */
								href="https://fonts.googleapis.com/css?family=Noto+Serif:400,400i,700,700i&subset=cyrillic,cyrillic-ext,greek,greek-ext,latin-ext,vietnamese"
								/* eslint-enable max0-len */
							/>
							<link
								rel="preload"
								as="style"
								href={ `//s${
									shouldUseSingleCDN ? '0' : '1'
								}.wp.com/i/noticons/noticons.css?v=20150727` }
							/>
						</Fragment>
					) }

					{ shouldUseStylePreloadSection &&
						sectionCss && (
							<link rel="preload" as="style" href={ sectionCss.urls[ isRTL ? 'rtl' : 'ltr' ] } />
						) }

					{ shouldUseStylePreloadCommon && (
						<link rel="preload" as="style" href={ this.getStylesheetUrl() } />
					) }

					{ shouldUseScriptPreload && (
						<Fragment>
							{ i18nLocaleScript && <link rel="preload" as="script" href={ i18nLocaleScript } /> }
							<link rel="preload" as="script" href={ urls.manifest } />
							<link rel="preload" as="script" href={ urls.vendor } />
							<link rel="preload" as="script" href={ urls[ jsFile ] } />
							{ chunk && <link rel="preload" as="script" href={ urls[ chunk ] } /> }
						</Fragment>
					) }
				</Head>
				<body className={ classNames( { rtl: isRTL } ) }>
					{ /* eslint-disable wpcalypso/jsx-classname-namespace, react/no-danger */ }
					{ renderedLayout ? (
						<div
							id="wpcom"
							className="wpcom-site"
							dangerouslySetInnerHTML={ {
								__html: renderedLayout,
							} }
						/>
					) : (
						<div id="wpcom" className="wpcom-site">
							<div
								className={ classNames( 'layout', {
									[ 'is-group-' + sectionGroup ]: sectionGroup,
								} ) }
							>
								<Masterbar />
								<div className="layout__content">
									<div className="wpcom-site__logo noticon noticon-wordpress" />
									{ hasSecondary && (
										<Fragment>
											<div className="layout__secondary" />
											<ul className="sidebar" />
										</Fragment>
									) }
									{ sectionGroup === 'editor' && (
										<div className="card editor-ground-control">
											<div className="editor-ground-control__action-buttons" />
										</div>
									) }
								</div>
							</div>
						</div>
					) }
					{ badge && (
						<div className="environment-badge">
							{ abTestHelper && <div className="environment is-tests" /> }
							{ branchName &&
								branchName !== 'master' && (
									<span className="environment branch-name" title={ 'Commit ' + commitChecksum }>
										{ branchName }
									</span>
								) }
							{ devDocs && (
								<span className="environment is-docs">
									<a href={ devDocsURL } title="DevDocs">
										docs
									</a>
								</span>
							) }
							<span className={ `environment is-${ badge } is-env` }>{ badge }</span>
							<a
								className="bug-report"
								href={ feedbackURL }
								title="Report an issue"
								target="_blank"
							/>
						</div>
					) }

					{ user && (
						<script
							type="text/javascript"
							dangerouslySetInnerHTML={ {
								__html: 'var currentUser = ' + jsonStringifyForHtml( user ),
							} }
						/>
					) }
					{ app && (
						<script
							type="text/javascript"
							dangerouslySetInnerHTML={ {
								__html: 'var app = ' + jsonStringifyForHtml( app ),
							} }
						/>
					) }
					{ initialReduxState && (
						<script
							type="text/javascript"
							dangerouslySetInnerHTML={ {
								__html: 'var initialReduxState = ' + jsonStringifyForHtml( initialReduxState ),
							} }
						/>
					) }
					{ config && (
						<script
							type="text/javascript"
							dangerouslySetInnerHTML={ {
								__html: config,
							} }
						/>
					) }
					{ i18nLocaleScript && <script src={ i18nLocaleScript } /> }
					<script src={ urls.manifest } />
					<script src={ urls.vendor } />
					<script src={ urls[ jsFile ] } />
					{ chunk && <script src={ urls[ chunk ] } /> }
					<script>window.AppBoot();</script>
					<noscript className="wpcom-site__global-noscript">
						Please enable JavaScript in your browser to enjoy WordPress.com.
					</noscript>
					{ /* eslint-enable wpcalypso/jsx-classname-namespace, react/no-danger */ }
				</body>
			</html>
		);
	}
}

export default Document;
