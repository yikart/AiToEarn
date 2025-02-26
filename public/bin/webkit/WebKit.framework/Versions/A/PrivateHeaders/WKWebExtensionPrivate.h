/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <WebKit/WKWebExtension.h>

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

@interface WKWebExtension ()

// FIXME: Remove after Safari has adopted new methods.
- (nullable instancetype)initWithAppExtensionBundle:(NSBundle *)appExtensionBundle error:(NSError **)error;
- (nullable instancetype)initWithResourceBaseURL:(NSURL *)resourceBaseURL error:(NSError **)error;

/*!
 @abstract Returns a web extension initialized with a specified app extension bundle.
 @param appExtensionBundle The bundle to use for the new web extension.
 @param error Set to \c nil or an error instance if an error occurred.
 @result An initialized web extension, or `nil` if the object could not be initialized due to an error.
 */
- (nullable instancetype)_initWithAppExtensionBundle:(NSBundle *)appExtensionBundle error:(NSError **)error;

/*!
 @abstract Returns a web extension initialized with a specified resource base URL.
 @param resourceBaseURL The directory URL to use for the new web extension.
 @param error Set to \c nil or an error instance if an error occurred.
 @result An initialized web extension, or `nil` if the object could not be initialized due to an error.
 @discussion The URL must be a file URL that points to either a directory containing a `manifest.json` file or a valid ZIP archive.
 */
- (nullable instancetype)_initWithResourceBaseURL:(NSURL *)resourceBaseURL error:(NSError **)error;

/*!
 @abstract Returns a web extension initialized with a specified app extension bundle and resource base URL.
 @param appExtensionBundle The bundle to use for the new web extension. Can be \c nil if a resource base URL is provided.
 @param resourceBaseURL The directory URL to use for the new web extension. Can be \c nil if an app extension bundle is provided.
 @param error Set to \c nil or an error instance if an error occurred.
 @result An initialized web extension, or `nil` if the object could not be initialized due to an error.
 @discussion Either the app extension bundle or the resource base URL (which can point to a directory or a valid ZIP archive) must be provided.
 This initializer is useful when the extension resources are in a different location from the app extension bundle used for native messaging.
 */
- (nullable instancetype)_initWithAppExtensionBundle:(nullable NSBundle *)appExtensionBundle resourceBaseURL:(nullable NSURL *)resourceBaseURL error:(NSError **)error NS_DESIGNATED_INITIALIZER;

/*!
 @abstract Returns a web extension initialized with a specified manifest dictionary.
 @param manifest The dictionary containing the manifest data for the web extension.
 @result An initialized web extension, or `nil` if the object could not be initialized due to an error.
 */
- (nullable instancetype)_initWithManifestDictionary:(NSDictionary<NSString *, id> *)manifest;

/*!
 @abstract Returns a web extension initialized with a specified manifest dictionary and resources.
 @param manifest The dictionary containing the manifest data for the web extension.
 @param resources A dictionary of file paths to data, string, or JSON-serializable values.
 @result An initialized web extension, or `nil` if the object could not be initialized due to an error.
 @discussion The resources dictionary provides additional data required for the web extension. Paths in resources can
 have subdirectories, such as `_locales/en/messages.json`.
 */
- (nullable instancetype)_initWithManifestDictionary:(NSDictionary<NSString *, id> *)manifest resources:(nullable NSDictionary<NSString *, id> *)resources NS_DESIGNATED_INITIALIZER;

/*!
 @abstract Returns a web extension initialized with specified resources.
 @param resources A dictionary of file paths to data, string, or JSON-serializable values.
 @result An initialized web extension, or `nil` if the object could not be initialized due to an error.
 @discussion The resources dictionary must provide at least the `manifest.json` resource.  Paths in resources can
 have subdirectories, such as `_locales/en/messages.json`.
 */
- (nullable instancetype)_initWithResources:(NSDictionary<NSString *, id> *)resources NS_DESIGNATED_INITIALIZER;

/*! @abstract A Boolean value indicating whether the extension background content is a service worker. */
@property (readonly, nonatomic) BOOL _hasServiceWorkerBackgroundContent;

/*! @abstract A Boolean value indicating whether the extension use modules for the background content. */
@property (readonly, nonatomic) BOOL _hasModularBackgroundContent;

/*! @abstract A Boolean value indicating whether the extension has a sidebar. */
@property (readonly, nonatomic) BOOL _hasSidebar;

@end

WK_HEADER_AUDIT_END(nullability, sendability)
