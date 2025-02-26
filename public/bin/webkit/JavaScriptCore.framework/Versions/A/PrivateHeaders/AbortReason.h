/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#pragma once

namespace JSC {

// It's important to not change the values of existing abort reasons unless we really
// have to. For this reason there is a BASIC-style numbering that should allow us to
// sneak new reasons in without changing the numbering of existing reasons - at least
// for a while.
enum AbortReason {
    AHCallFrameMisaligned                             =  10,
    AHIndexingTypeIsValid                             =  20,
    AHInsaneArgumentCount                             =  30,
    AHIsNotCell                                       =  40,
    AHIsNotInt32                                      =  50,
    AHIsNotJSDouble                                   =  60,
    AHIsNotJSInt32                                    =  70,
    AHIsNotJSNumber                                   =  80,
    AHIsNotNull                                       =  90,
    AHStackPointerMisaligned                          = 100,
    AHInvalidCodeBlock                                = 101,
    AHStructureIDIsValid                              = 110,
    AHNotCellMaskNotInPlace                           = 120,
    AHNumberTagNotInPlace                             = 130,
    AHTypeInfoInlineTypeFlagsAreValid                 = 140,
    AHTypeInfoIsValid                                 = 150,
    B3Oops                                            = 155,
    DFGBailedAtTopOfBlock                             = 161,
    DFGBailedAtEndOfNode                              = 162,
    DFGBasicStorageAllocatorZeroSize                  = 170,
    DFGIsNotCell                                      = 180,
    DFGIneffectiveWatchpoint                          = 190,
    DFGNegativeStringLength                           = 200,
    DFGSlowPathGeneratorFellThrough                   = 210,
    DFGUnreachableBasicBlock                          = 220,
    DFGUnreachableNode                                = 225,
    DFGUnreasonableOSREntryJumpDestination            = 230,
    DFGVarargsThrowingPathDidNotThrow                 = 235,
    FTLCrash                                          = 236,
    JITDidReturnFromTailCall                          = 237,
    JITDivOperandsAreNotNumbers                       = 240,
    JITGetByValResultIsNotEmpty                       = 250,
    JITNotSupported                                   = 260,
    JITOffsetIsNotOutOfLine                           = 270,
    JITUncaughtExceptionAfterCall                     = 275,
    JITUnexpectedCallFrameSize                        = 277,
    JITUnreasonableLoopHintJumpTarget                 = 280,
    MacroAssemblerOops                                = 285,
    RPWUnreasonableJumpTarget                         = 290,
    RepatchIneffectiveWatchpoint                      = 300,
    RepatchInsaneArgumentCount                        = 310,
    TGInvalidPointer                                  = 320,
    TGNotSupported                                    = 330,
    UncheckedOverflow                                 = 335,
    VMCreationDisallowed                              = 998,
    VMEntryDisallowed                                 = 999,
};

// This enum is for CRASH_WITH_SECURITY_IMPLICATION_AND_INFO so we can easily identify which assertion
// we are looking at even if the calls to crash get coalesed. The same numbering rules above for
// AbortReason apply here.
enum CompilerAbortReason {
    AbstractInterpreterInvalidType                =  10,
    ObjectAllocationSinkingAssertionFailure       = 100,
};

} // namespace JSC
