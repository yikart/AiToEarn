/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef JSContextPrivate_h
#define JSContextPrivate_h

#if JSC_OBJC_API_ENABLED

#import <JavaScriptCore/JSContext.h>

@protocol JSModuleLoaderDelegate <NSObject>

@required

/*! @abstract Provides source code for any JS module that is actively imported.
 @param context The context for which the module is being requested.
 @param identifier The resolved identifier for the requested module.
 @param resolve A JS function to call with the desired script for identifier.
 @param reject A JS function to call when identifier cannot be fetched.
 @discussion Currently, identifier will always be an absolute file URL computed from specifier of the requested module relative to the URL of the requesting script. If the requesting script does not have a URL and the module specifier is not an absolute path the module loader will fail to load the module.

 The first argument to resolve sholud always be a JSScript, otherwise the module loader will reject the module.

 Once an identifier has been resolved or rejected in a given context it will never be requested again. If a script is successfully evaluated it will not be re-evaluated on any subsequent import.

 The VM will retain all evaluated modules for the lifetime of the context.
 */
- (void)context:(JSContext *)context fetchModuleForIdentifier:(JSValue *)identifier withResolveHandler:(JSValue *)resolve andRejectHandler:(JSValue *)reject;

@optional

/*! @abstract This is called before the module with "key" is evaluated.
 @param key The module key for the module that is about to be evaluated.
 */
- (void)willEvaluateModule:(NSURL *)key;

/*! @abstract This is called after the module with "key" is evaluated.
 @param key The module key for the module that was just evaluated.
 */
- (void)didEvaluateModule:(NSURL *)key;

@end

@interface JSContext(Private)

/*!
@property
@discussion Remote inspection setting of the JSContext. Default value is YES.
*/
@property (setter=_setRemoteInspectionEnabled:) BOOL _remoteInspectionEnabled JSC_API_DEPRECATED_WITH_REPLACEMENT("inspectable", macos(10.10, 13.3), ios(8.0, 16.4));

/*!
@property
@discussion Set whether or not the native call stack is included when reporting exceptions. Default value is YES.
*/
@property (setter=_setIncludesNativeCallStackWhenReportingExceptions:) BOOL _includesNativeCallStackWhenReportingExceptions JSC_API_AVAILABLE(macos(10.10), ios(8.0));

/*!
@property
@discussion Set the run loop the Web Inspector debugger should use when evaluating JavaScript in the JSContext.
*/
@property (setter=_setDebuggerRunLoop:) CFRunLoopRef _debuggerRunLoop JSC_API_AVAILABLE(macos(10.10), ios(8.0));

/*! @abstract The delegate the context will use when trying to load a module. Note, this delegate will be ignored for contexts returned by UIWebView. */
@property (nonatomic, weak) id <JSModuleLoaderDelegate> moduleLoaderDelegate JSC_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @method
 @abstract Run a JSScript.
 @param script the JSScript to evaluate.
 @discussion If the provided JSScript was created with kJSScriptTypeProgram, the script will run synchronously and return the result of evaluation.

 Otherwise, if the script was created with kJSScriptTypeModule, the module will be run asynchronously and will return a promise resolved when the module and any transitive dependencies are loaded. The module loader will treat the script as if it had been returned from a delegate call to moduleLoaderDelegate. This mirrors the JavaScript dynamic import operation.
 */
// FIXME: Before making this public need to fix: https://bugs.webkit.org/show_bug.cgi?id=199714
- (JSValue *)evaluateJSScript:(JSScript *)script JSC_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @method
 @abstract Get the identifiers of the modules a JSScript depends on in this context.
 @param script the JSScript to determine the dependencies of.
 @result An Array containing all the identifiers of modules script depends on.
 @discussion If the provided JSScript was not created with kJSScriptTypeModule, an exception will be thrown. Also, if the script has not already been evaluated in this context an error will be throw.
 */
- (JSValue *)dependencyIdentifiersForModuleJSScript:(JSScript *)script JSC_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @method
 @abstract Mark this JSContext as an ITMLKit context for the purposes of remote inspection capabilities.
 */
- (void)_setITMLDebuggableType JSC_API_AVAILABLE(macos(11.0), ios(14.0));

@end

#endif

#endif // JSContextInternal_h
