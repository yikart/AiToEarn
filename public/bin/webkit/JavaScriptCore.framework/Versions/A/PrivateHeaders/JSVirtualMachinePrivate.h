/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#import "JSExportMacros.h"
#import <JavaScriptCore/JavaScript.h>

#if JSC_OBJC_API_ENABLED

#import <JavaScriptCore/JSVirtualMachine.h>

@interface JSVirtualMachine(JSPrivate)

/*!
@method
@discussion Shrinks the memory footprint of the VM by deleting various internal caches,
 running synchronous garbage collection, and releasing memory back to the OS. Note: this
 API waits until no JavaScript is running on the stack before it frees any memory. It's
 best to call this API when no JavaScript is running on the stack for this reason. However, if
 you do call this API when JavaScript is running on the stack, the API will wait until all JavaScript
 on the stack finishes running to free memory back to the OS. Therefore, calling this
 API may not synchronously free memory.
*/

- (void)shrinkFootprintWhenIdle JSC_API_AVAILABLE(macos(10.14), ios(12.0));

/*!
@method
@abstract Set the number of threads to be used by the DFG JIT compiler.
@discussion If called after the VM has been initialized, it will terminate
 threads until it meets the new limit or create new threads accordingly if the
 new limit is higher than the previous limit. If called before initialization,
 the Options value for the number of DFG threads will be updated to ensure the
 DFG compiler already starts with the up-to-date limit.
@param numberOfThreads The number of threads the DFG compiler should use going forward
@result The previous number of threads being used by the DFG compiler
*/
+ (NSUInteger)setNumberOfDFGCompilerThreads:(NSUInteger)numberOfThreads JSC_API_AVAILABLE(macos(10.14), ios(12.0));

/*!
@method
@abstract Set the number of threads to be used by the FTL JIT compiler.
@discussion If called after the VM has been initialized, it will terminate
 threads until it meets the new limit or create new threads accordingly if the
 new limit is higher than the previous limit. If called before initialization,
 the Options value for the number of FTL threads will be updated to ensure the
 FTL compiler already starts with the up-to-date limit.
@param numberOfThreads The number of threads the FTL compiler should use going forward
@result The previous number of threads being used by the FTL compiler
*/
+ (NSUInteger)setNumberOfFTLCompilerThreads:(NSUInteger)numberOfThreads JSC_API_AVAILABLE(macos(10.14), ios(12.0));

/*!
@method
@abstract Allows embedders of JSC to specify that JSC should crash the process if a VM is created when unexpected.
@param shouldCrash Sets process-wide state that indicates whether VM creation should crash or not.
*/
+ (void)setCrashOnVMCreation:(BOOL)shouldCrash;

@end

#endif // JSC_OBJC_API_ENABLED
