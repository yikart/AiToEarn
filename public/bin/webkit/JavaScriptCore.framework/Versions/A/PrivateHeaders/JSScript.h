/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#import <JavaScriptCore/JSValue.h>

#if JSC_OBJC_API_ENABLED

NS_ASSUME_NONNULL_BEGIN

@class JSVirtualMachine;

/*!
 @enum JSScriptType
 @abstract     A constant identifying the execution type of a JSScript.
 @constant     kJSScriptTypeProgram  The type of a normal JavaScript program.
 @constant     kJSScriptTypeModule   The type of a module JavaScript program.
 */
typedef NS_ENUM(NSInteger, JSScriptType) {
    kJSScriptTypeProgram,
    kJSScriptTypeModule,
};


JSC_CLASS_AVAILABLE(macos(10.15), ios(13.0))
@interface JSScript : NSObject

/*!
 @method
 @abstract Create a JSScript for the specified virtual machine.
 @param type The type of JavaScript source.
 @param source The source code to use when the script is evaluated by the JS vm.
 @param sourceURL The source URL to associate with this script. For modules, this is the module identifier.
 @param cachePath A URL containing the path where the VM should cache for future execution. On creation, we use this path to load the cached bytecode off disk. If the cached bytecode at this location is stale, you should delete that file before calling this constructor.
 @param vm The JSVirtualMachine the script can be evaluated in.
 @param error A description of why the script could not be created if the result is nil.
 @result The new script.
 @discussion The file at cachePath should not be externally modified for the lifecycle of vm.
 */
+ (nullable instancetype)scriptOfType:(JSScriptType)type withSource:(NSString *)source andSourceURL:(NSURL *)sourceURL andBytecodeCache:(nullable NSURL *)cachePath inVirtualMachine:(JSVirtualMachine *)vm error:(out NSError * _Nullable * _Nullable)error;

/*!
 @method
 @abstract Create a JSScript for the specified virtual machine with a path to a codesigning and bytecode caching.
 @param type The type of JavaScript source.
 @param filePath A URL containing the path to a JS source code file on disk.
 @param sourceURL The source URL to associate with this script. For modules, this is the module identifier.
 @param cachePath A URL containing the path where the VM should cache for future execution. On creation, we use this path to load the cached bytecode off disk. If the cached bytecode at this location is stale, you should delete that file before calling this constructor.
 @param vm The JSVirtualMachine the script can be evaluated in.
 @param error A description of why the script could not be created if the result is nil.
 @result The new script.
 @discussion The files at filePath and cachePath should not be externally modified for the lifecycle of vm. This method will file back the memory for the source.

 If the file at filePath is not ascii this method will return nil.
 */
+ (nullable instancetype)scriptOfType:(JSScriptType)type memoryMappedFromASCIIFile:(NSURL *)filePath withSourceURL:(NSURL *)sourceURL andBytecodeCache:(nullable NSURL *)cachePath inVirtualMachine:(JSVirtualMachine *)vm error:(out NSError * _Nullable * _Nullable)error;

/*!
 @method
 @abstract Cache the bytecode for this JSScript to disk at the path passed in during creation.
 @param error A description of why the script could not be cached if the result is FALSE.
 */
- (BOOL)cacheBytecodeWithError:(out NSError * _Nullable * _Nullable)error;

/*!
 @method
 @abstract Returns true when evaluating this JSScript will use the bytecode cache. Returns false otherwise.
 */
- (BOOL)isUsingBytecodeCache;

/*!
 @method
 @abstract Returns the JSScriptType of this JSScript.
 */
- (JSScriptType)type;

/*!
 @method
 @abstract Returns the sourceURL of this JSScript.
 */
- (NSURL *)sourceURL;

@end

NS_ASSUME_NONNULL_END

#endif // JSC_OBJC_API_ENABLED
