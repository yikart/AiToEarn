/*
 * Copyright (C) 2019-2024 Apple Inc. All rights reserved.
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

#include "GCLogging.h"
#include "JSExportMacros.h"
#include "OSCheck.h"
#include <wtf/MathExtras.h>

#if OS(DARWIN)
#include <mach/vm_param.h>
#endif

using WTF::PrintStream;

namespace JSC {

#define MAXIMUM_NUMBER_OF_FTL_COMPILER_THREADS 8

JS_EXPORT_PRIVATE bool canUseJITCage();
bool canUseHandlerIC();
bool hasCapacityToUseLargeGigacage();

// How do JSC VM options work?
// ===========================
// The FOR_EACH_JSC_OPTION() macro below defines a list of all JSC options in use,
// along with their types and default values. The options values are actually
// realized as fields in OptionsStorage embedded in JSC::Config.
//
//     Options::initialize() will initialize the option values with the defaults
// specified in FOR_EACH_JSC_OPTION() below. After that, the values can be
// programmatically read and written to using an accessor method with the same
// name as the option. For example, the option "useJIT" can be read and set like
// so:
//
//     bool jitIsOn = Options::useJIT();  // Get the option value.
//     Options::useJIT() = false;         // Sets the option value.
//
//     If you want to tweak any of these values programmatically for testing
// purposes, you can do so in Options::initialize() after the default values
// are set.
//
//     Alternatively, you can override the default values by specifying
// environment variables of the form: JSC_<name of JSC option>.
//
// Note: Options::initialize() tries to ensure some sanity on the option values
// which are set by doing some range checks, and value corrections. These
// checks are done after the option values are set. If you alter the option
// values after the sanity checks (for your own testing), then you're liable to
// ensure that the new values set are sane and reasonable for your own run.
//
// Any modifications to options must be done before the first VM is instantiated.
// On instantiation of the first VM instance, the Options will be write protected
// and cannot be modified thereafter.

#define FOR_EACH_JSC_OPTION(v)                                          \
    v(Bool, useKernTCSM, defaultTCSMValue(), Normal, "Note: this needs to go before other options since they depend on this value."_s) \
    v(Bool, validateOptions, false, Normal, "crashes if mis-typed JSC options were passed to the VM"_s) \
    v(Unsigned, dumpOptions, 0, Normal, "dumps JSC options (0 = None, 1 = Overridden only, 2 = All, 3 = Verbose)"_s) \
    v(OptionString, configFile, nullptr, Normal, "file to configure JSC options and logging location"_s) \
    \
    v(Bool, useLLInt,  true, Normal, "allows the LLINT to be used if true"_s) \
    v(Bool, useJIT, jitEnabledByDefault(), Normal, "allows the executable pages to be allocated for JIT and thunks if true"_s) \
    v(Bool, useWasmJIT, jitEnabledByDefault(), Normal, "allows wasm to use JIT and thunks if true"_s) \
    v(Bool, useBaselineJIT, true, Normal, "allows the baseline JIT to be used if true"_s) \
    v(Bool, useDFGJIT, true, Normal, "allows the DFG JIT to be used if true"_s) \
    v(Bool, useRegExpJIT, jitEnabledByDefault(), Normal, "allows the RegExp JIT to be used if true"_s) \
    v(Bool, useDOMJIT, is64Bit(), Normal, "allows the DOMJIT to be used if true"_s) \
    \
    v(Bool, reportMustSucceedExecutableAllocations, false, Normal, nullptr) \
    \
    v(Unsigned, maxPerThreadStackUsage, 5 * MB, Normal, "Max allowed stack usage by the VM"_s) \
    v(Unsigned, softReservedZoneSize, 128 * KB, Normal, "A buffer greater than reservedZoneSize that reserves space for stringifying exceptions."_s) \
    v(Unsigned, reservedZoneSize, 64 * KB, Normal, "The amount of stack space we guarantee to our clients (and to interal VM code that does not call out to clients)."_s) \
    \
    v(Bool, crashOnDisallowedVMEntry, ASSERT_ENABLED, Normal, "Forces a crash if we attempt to enter the VM when disallowed"_s) \
    v(Bool, crashIfCantAllocateJITMemory, false, Normal, nullptr) \
    v(Unsigned, jitMemoryReservationSize, 0, Normal, "Set this number to change the executable allocation size in ExecutableAllocatorFixedVMPool. (In bytes.)"_s) \
    \
    v(Bool, forceCodeBlockLiveness, false, Normal, nullptr) \
    v(Bool, forceICFailure, false, Normal, nullptr) \
    v(Bool, forceUnlinkedDFG, false, Normal, nullptr) \
    \
    v(Unsigned, repatchCountForCoolDown, 8, Normal, nullptr) \
    v(Unsigned, initialCoolDownCount, 20, Normal, nullptr) \
    v(Unsigned, repatchBufferingCountdown, 6, Normal, nullptr) \
    v(Unsigned, initialRepatchBufferingCountdown, 6, Normal, nullptr) \
    \
    v(Bool, dumpGeneratedBytecodes, false, Normal, nullptr) \
    v(Bool, dumpGeneratedWasmBytecodes, false, Normal, nullptr) \
    v(Bool, dumpBytecodeLivenessResults, false, Normal, nullptr) \
    v(Bool, validateBytecode, false, Normal, nullptr) \
    v(Bool, forceDebuggerBytecodeGeneration, false, Normal, nullptr) \
    v(Bool, debuggerTriggersBreakpointException, false, Normal, "Using the debugger statement will trigger an breakpoint exception (Useful when lldbing)"_s) \
    v(Bool, dumpBytecodesBeforeGeneratorification, false, Normal, nullptr) \
    \
    v(Bool, useFunctionDotArguments, true, Normal, nullptr) \
    v(Bool, useTailCalls, true, Normal, nullptr) \
    v(Bool, optimizeRecursiveTailCalls, true, Normal, nullptr) \
    v(Bool, alwaysUseShadowChicken, false, Normal, nullptr) \
    v(Unsigned, shadowChickenLogSize, 1000, Normal, nullptr) \
    v(Unsigned, shadowChickenMaxTailDeletedFramesSize, 128, Normal, nullptr) \
    \
    v(Bool, useIterationIntrinsics, true, Normal, nullptr) \
    \
    v(OSLogType, useOSLog, OSLogType::None, Normal, "Log dataLog()s to os_log instead of stderr"_s) \
    /* dumpDisassembly implies dumpDFGDisassembly. */ \
    v(Bool, needDisassemblySupport, false, Normal, nullptr) \
    v(Bool, dumpDisassembly, false, Normal, "dumps disassembly of all JIT compiled code upon compilation"_s) \
    v(Bool, asyncDisassembly, false, Normal, nullptr) \
    v(Bool, logJIT, false, Normal, nullptr) \
    v(Bool, dumpBaselineDisassembly, false, Normal, "dumps disassembly of Baseline function upon compilation"_s) \
    v(Bool, dumpDFGDisassembly, false, Normal, "dumps disassembly of DFG function upon compilation"_s) \
    v(Bool, dumpFTLDisassembly, false, Normal, "dumps disassembly of FTL function upon compilation"_s) \
    v(Bool, dumpRegExpDisassembly, false, Normal, "dumps disassembly of RegExp upon compilation"_s) \
    v(Bool, dumpWasmDisassembly, false, Normal, "dumps disassembly of all wasm code upon compilation"_s) \
    v(OptionString, dumpWasmSourceFileName, nullptr, Normal, "log every wasm module validation, and dump source bytes to <filename>.0.wasm, <filename>.1.wasm, etc..."_s) \
    v(OptionString, wasmOMGFunctionsToDump, nullptr, Normal, "file with newline separated list of function indices to dump IR/disassembly for, if no such file exists, the function index itself"_s) \
    v(Bool, dumpBBQDisassembly, false, Normal, "dumps disassembly of BBQ wasm code upon compilation"_s) \
    v(Bool, dumpOMGDisassembly, false, Normal, "dumps disassembly of OMG wasm code upon compilation"_s) \
    v(Bool, logJITCodeForPerf, false, Configurable, nullptr) \
    v(OptionString, jitDumpDirectory, nullptr, Normal, "Directory to place JITDump"_s) \
    v(OptionRange, bytecodeRangeToJITCompile, nullptr, Normal, "bytecode size range to allow compilation on, e.g. 1:100"_s) \
    v(OptionRange, bytecodeRangeToDFGCompile, nullptr, Normal, "bytecode size range to allow DFG compilation on, e.g. 1:100"_s) \
    v(OptionRange, bytecodeRangeToFTLCompile, nullptr, Normal, "bytecode size range to allow FTL compilation on, e.g. 1:100"_s) \
    v(OptionString, jitAllowlist, nullptr, Normal, "file with newline separated list of function signatures to allow compilation on or, if no such file exists, the function signature to allow"_s) \
    v(OptionString, dfgAllowlist, nullptr, Normal, "file with newline separated list of function signatures to allow DFG compilation on or, if no such file exists, the function signature to allow"_s) \
    v(OptionString, ftlAllowlist, nullptr, Normal, "file with newline separated list of function signatures to allow FTL compilation on or, if no such file exists, the function signature to allow"_s) \
    v(OptionString, bbqAllowlist, nullptr, Normal, "file with newline separated list of function indices to allow BBQ compilation on or, if no such file exists, the function index to allow"_s) \
    v(OptionString, omgAllowlist, nullptr, Normal, "file with newline separated list of function indices to allow OMG compilation on or, if no such file exists, the function index to allow"_s) \
    v(Bool, dumpSourceAtDFGTime, false, Normal, "dumps source code of JS function being DFG compiled"_s) \
    v(Bool, dumpBytecodeAtDFGTime, false, Normal, "dumps bytecode of JS function being DFG compiled"_s) \
    v(Bool, dumpGraphAfterParsing, false, Normal, nullptr) \
    v(Bool, dumpGraphAtEachPhase, false, Normal, nullptr) \
    v(Bool, dumpDFGGraphAtEachPhase, false, Normal, "dumps the DFG graph at each phase of DFG compilation (note this excludes DFG graphs during FTL compilation)"_s) \
    v(Bool, dumpDFGFTLGraphAtEachPhase, false, Normal, "dumps the DFG graph at each phase of DFG compilation when compiling FTL code"_s) \
    v(Bool, dumpB3GraphAtEachPhase, false, Normal, "dumps the B3 graph at each phase of compilation"_s) \
    v(Bool, dumpAirGraphAtEachPhase, false, Normal, "dumps the Air graph at each phase of compilation"_s) \
    v(Bool, verboseDFGBytecodeParsing, false, Normal, nullptr) \
    v(Bool, safepointBeforeEachPhase, true, Normal, nullptr) \
    v(Bool, verboseCompilation, false, Normal, nullptr) \
    v(Bool, verboseFTLCompilation, false, Normal, nullptr) \
    v(Bool, logCompilationChanges, false, Normal, nullptr) \
    v(Bool, printEachOSRExit, false, Normal, nullptr) \
    v(Bool, useJITAsserts, ASSERT_ENABLED, Normal, nullptr) \
    v(Bool, validateDoesGC, ASSERT_ENABLED, Normal, nullptr) \
    v(Bool, validateGraph, false, Normal, nullptr) \
    v(Bool, validateGraphAtEachPhase, false, Normal, nullptr) \
    v(Bool, verboseValidationFailure, false, Normal, nullptr) \
    v(Bool, verboseOSR, false, Normal, nullptr) \
    v(Bool, verboseDFGOSRExit, false, Normal, nullptr) \
    v(Bool, verboseFTLOSRExit, false, Normal, nullptr) \
    v(Bool, verboseCallLink, false, Normal, nullptr) \
    v(Bool, verboseCompilationQueue, false, Normal, nullptr) \
    v(Bool, reportCompileTimes, false, Normal, "dumps JS function signature and the time it took to compile in all tiers"_s) \
    v(Bool, reportBaselineCompileTimes, false, Normal, "dumps JS function signature and the time it took to BaselineJIT compile"_s) \
    v(Bool, reportDFGCompileTimes, false, Normal, "dumps JS function signature and the time it took to DFG and FTL compile"_s) \
    v(Bool, reportFTLCompileTimes, false, Normal, "dumps JS function signature and the time it took to FTL compile"_s) \
    v(Bool, reportTotalCompileTimes, false, Normal, nullptr) \
    v(Bool, reportTotalPhaseTimes, false, Normal, "This prints phase times at the end of running script inside jsc.cpp"_s) \
    v(Bool, reportParseTimes, false, Normal, "dumps JS function signature and the time it took to parse"_s) \
    v(Bool, reportBytecodeCompileTimes, false, Normal, "dumps JS function signature and the time it took to bytecode compile"_s) \
    v(Bool, countParseTimes, false, Normal, "counts parse times"_s) \
    v(Bool, verboseExitProfile, false, Normal, nullptr) \
    v(Bool, verboseCFA, false, Normal, nullptr) \
    v(Bool, verboseDFGFailure, false, Normal, nullptr) \
    v(Bool, verboseFTLToJSThunk, false, Normal, nullptr) \
    v(Bool, verboseFTLFailure, false, Normal, nullptr) \
    v(Bool, alwaysComputeHash, false, Normal, nullptr) \
    v(Bool, testTheFTL, false, Normal, nullptr) \
    v(Bool, verboseSanitizeStack, false, Normal, nullptr) \
    v(Bool, useGenerationalGC, true, Normal, nullptr) \
    v(Bool, useConcurrentGC, true, Normal, nullptr) \
    v(Bool, collectContinuously, false, Normal, nullptr) \
    v(Double, collectContinuouslyPeriodMS, 1, Normal, nullptr) \
    v(Bool, forceFencedBarrier, false, Normal, nullptr) \
    v(Bool, verboseVisitRace, false, Normal, nullptr) \
    v(Bool, optimizeParallelSlotVisitorsForStoppedMutator, false, Normal, nullptr) \
    v(Bool, verboseHeapSnapshotLogging, true, Normal, nullptr) \
    v(Unsigned, largeHeapSize, 32 * 1024 * 1024, Normal, nullptr) \
    v(Unsigned, smallHeapSize, 1 * 1024 * 1024, Normal, nullptr) \
    v(Double, smallHeapRAMFraction, 0.25, Normal, nullptr) \
    v(Double, smallHeapGrowthFactor, 2, Normal, nullptr) \
    v(Double, mediumHeapRAMFraction, 0.5, Normal, nullptr) \
    v(Double, mediumHeapGrowthFactor, 1.5, Normal, nullptr) \
    v(Double, largeHeapGrowthFactor, 1.24, Normal, nullptr) \
    v(Double, miniVMHeapGrowthFactor, 1.20, Normal, nullptr) \
    v(Double, heapGrowthSteepnessFactor, 1.00, Normal, nullptr) \
    v(Double, heapGrowthMaxIncrease, 2.00, Normal, nullptr) \
    v(Unsigned, heapGrowthFunctionThresholdInMB, 16 * 1024, Normal, nullptr) \
    v(Double, criticalGCMemoryThreshold, 0.80, Normal, "percent memory in use the GC considers critical.  The collector is much more aggressive above this threshold"_s) \
    v(Double, customFullGCCallbackBailThreshold, -1.0, Normal, "percent of memory paged out before we bail out of timer based Full GCs. -1.0 means use (maxHeapGrowthFactor - 1)"_s) \
    v(Double, minimumMutatorUtilization, 0, Normal, nullptr) \
    v(Double, maximumMutatorUtilization, 0.7, Normal, nullptr) \
    v(Double, epsilonMutatorUtilization, 0.01, Normal, nullptr) \
    v(Double, concurrentGCMaxHeadroom, 1.5, Normal, nullptr) \
    v(Double, concurrentGCPeriodMS, 2, Normal, nullptr) \
    v(Bool, useStochasticMutatorScheduler, true, Normal, nullptr) \
    v(Double, minimumGCPauseMS, 0.3, Normal, nullptr) \
    v(Double, gcPauseScale, 0.3, Normal, nullptr) \
    v(Double, gcIncrementBytes, 10000, Normal, nullptr) \
    v(Double, gcIncrementMaxBytes, 100000, Normal, nullptr) \
    v(Double, gcIncrementScale, 0, Normal, nullptr) \
    v(Bool, scribbleFreeCells, false, Normal, nullptr) \
    v(Double, sizeClassProgression, 1.4, Normal, nullptr) \
    v(Unsigned, preciseAllocationCutoff, 100000, Normal, nullptr) \
    v(Bool, dumpSizeClasses, false, Normal, nullptr) \
    v(Bool, useBumpAllocator, true, Normal, nullptr) \
    v(Bool, stealEmptyBlocksFromOtherAllocators, true, Normal, nullptr) \
    v(Bool, eagerlyUpdateTopCallFrame, false, Normal, nullptr) \
    v(Bool, dumpZappedCellCrashData, false, Normal, nullptr) \
    \
    v(Bool, useOSREntryToDFG, true, Normal, nullptr) \
    v(Bool, useOSREntryToFTL, true, Normal, nullptr) \
    \
    v(Bool, useFTLJIT, true, Normal, "allows the FTL JIT to be used if true"_s) \
    v(Bool, validateFTLOSRExitLiveness, false, Normal, nullptr) \
    v(Unsigned, defaultB3OptLevel, 2, Normal, nullptr) \
    v(Bool, b3AlwaysFailsBeforeCompile, false, Normal, nullptr) \
    v(Bool, b3AlwaysFailsBeforeLink, false, Normal, nullptr) \
    v(Bool, validateSerializedValue, false, Normal, nullptr) /* tests CloneSerializer/Deserializer */ \
    v(Bool, ftlCrashes, false, Normal, nullptr) /* fool-proof way of checking that you ended up in the FTL. ;-) */\
    v(Bool, clobberAllRegsInFTLICSlowPath, ASSERT_ENABLED, Normal, nullptr) \
    v(Bool, useJITDebugAssertions, ASSERT_ENABLED, Normal, nullptr) \
    v(Bool, useAccessInlining, true, Normal, nullptr) \
    v(Unsigned, maxAccessVariantListSize, 8, Normal, nullptr) \
    v(Bool, usePolyvariantDevirtualization, true, Normal, nullptr) \
    v(Bool, usePolymorphicAccessInlining, true, Normal, nullptr) \
    v(Unsigned, maxPolymorphicAccessInliningListSize, 8, Normal, nullptr) \
    v(Bool, usePolymorphicCallInlining, true, Normal, nullptr) \
    v(Bool, usePolymorphicCallInliningForNonStubStatus, false, Normal, nullptr) \
    v(Unsigned, maxPolymorphicCallVariantListSize, 8, Normal, nullptr) \
    v(Unsigned, maxPolymorphicCallVariantListSizeForTopTier, 5, Normal, nullptr) \
    v(Unsigned, maxPolymorphicCallVariantListSizeForWasmToJS, 5, Normal, nullptr) \
    v(Unsigned, maxPolymorphicCallVariantsForInlining, 5, Normal, nullptr) \
    v(Unsigned, frequentCallThreshold, 2, Normal, nullptr) \
    v(Double, minimumCallToKnownRate, 0.51, Normal, nullptr) \
    v(Bool, createPreHeaders, true, Normal, nullptr) \
    v(Bool, useMovHintRemoval, true, Normal, nullptr) \
    v(Bool, usePutStackSinking, true, Normal, nullptr) \
    v(Bool, useObjectAllocationSinking, true, Normal, nullptr) \
    v(Bool, useValueRepElimination, true, Normal, nullptr) \
    v(Bool, useArityFixupInlining, true, Normal, nullptr) \
    v(Bool, logExecutableAllocation, false, Normal, nullptr) \
    v(Unsigned, maxDFGNodesInBasicBlockForPreciseAnalysis, 20000, Normal, "Disable precise but costly analysis and give conservative results if the number of DFG nodes in a block exceeds this threshold"_s) \
    \
    v(Bool, useConcurrentJIT, true, Normal, "allows the DFG / FTL compilation in threads other than the executing JS thread"_s) \
    v(Unsigned, numberOfWorklistThreads, computeNumberOfWorkerThreads(3, 2), Normal, nullptr) \
    v(Unsigned, numberOfDFGCompilerThreads, computeNumberOfWorkerThreads(3, 2) - 1, Normal, nullptr) \
    v(Unsigned, numberOfFTLCompilerThreads, computeNumberOfWorkerThreads(MAXIMUM_NUMBER_OF_FTL_COMPILER_THREADS, 2) - 1, Normal, nullptr) \
    v(Unsigned, numberOfWasmCompilerThreads, computeNumberOfWorkerThreads(INT32_MAX, 2) - 1, Normal, nullptr) \
    v(Int32, priorityDeltaOfDFGCompilerThreads, computePriorityDeltaOfWorkerThreads(-1, 0), Normal, nullptr) \
    v(Int32, priorityDeltaOfFTLCompilerThreads, computePriorityDeltaOfWorkerThreads(-2, 0), Normal, nullptr) \
    v(Int32, priorityDeltaOfWasmCompilerThreads, computePriorityDeltaOfWorkerThreads(-1, 0), Normal, nullptr) \
    \
    v(Bool, useProfiler, false, Normal, nullptr) \
    v(Bool, dumpProfilerDataAtExit, false, Normal, nullptr) \
    v(Bool, disassembleBaselineForProfiler, true, Normal, nullptr) \
    v(Unsigned, abbreviateSourceCodeForProfiler, 0, Normal, nullptr) \
    \
    v(Bool, useArchitectureSpecificOptimizations, true, Normal, nullptr) \
    \
    v(Bool, breakOnThrow, false, Normal, nullptr) \
    \
    v(Unsigned, maximumOptimizationCandidateBytecodeCost, 100000, Normal, nullptr) \
    \
    v(Unsigned, maximumFunctionForCallInlineCandidateBytecodeCostForDFG, 80, Normal, nullptr) \
    v(Unsigned, maximumFunctionForClosureCallInlineCandidateBytecodeCostForDFG, 80, Normal, nullptr) \
    v(Unsigned, maximumFunctionForConstructInlineCandidateBytecodeCostForDFG, 80, Normal, nullptr) \
    v(Unsigned, maximumFunctionForCallInlineCandidateBytecodeCostForFTL, 160, Normal, nullptr) \
    v(Unsigned, maximumFunctionForClosureCallInlineCandidateBytecodeCostForFTL, 100, Normal, nullptr) \
    v(Unsigned, maximumFunctionForConstructInlineCandidateBytecodeCostForFTL, 100, Normal, nullptr) \
    \
    v(Unsigned, maximumFTLCandidateBytecodeCost, 20000, Normal, nullptr) \
    \
    /* Depth of inline stack, so 1 = no inlining, 2 = one level, etc. */ \
    v(Unsigned, maximumInliningDepth, 5, Normal, "maximum allowed inlining depth.  Depth of 1 means no inlining"_s) \
    v(Unsigned, maximumInliningRecursion, 2, Normal, nullptr) \
    \
    /* Maximum size of a caller for enabling inlining. This is purely to protect us */\
    /* from super long compiles that take a lot of memory. */\
    v(Unsigned, maximumInliningCallerBytecodeCost, 10000, Normal, nullptr) \
    \
    v(Unsigned, maximumVarargsForInlining, 100, Normal, nullptr) \
    \
    v(Unsigned, maximumBinaryStringSwitchCaseLength, 50, Normal, nullptr) \
    v(Unsigned, maximumBinaryStringSwitchTotalLength, 2000, Normal, nullptr) \
    v(Unsigned, maximumRegExpTestInlineCodesize, 500, Normal, "Maximum code size in bytes for inlined RegExp.test JIT code."_s) \
    \
    v(Unsigned, maximumWasmDepthForInlining, isIOS() ? 2 : 8, Normal, "Maximum inlining depth to consider inlining a wasm function."_s) \
    v(Unsigned, maximumWasmCalleeSizeForInlining, 200, Normal, "Maximum wasm size in bytes to consider inlining a wasm function."_s) \
    v(Unsigned, maximumWasmCallerSizeForInlining, 10000, Normal, "Maximum wasm size in bytes for the caller of an inlined function."_s) \
    \
    v(Double, jitPolicyScale, 1.0, Normal, "scale JIT thresholds to this specified ratio between 0.0 (compile ASAP) and 1.0 (compile like normal)."_s) \
    v(Bool, forceEagerCompilation, false, Normal, nullptr) \
    v(Int32, thresholdForJITAfterWarmUp, 500, Normal, nullptr) \
    v(Int32, thresholdForJITSoon, 100, Normal, nullptr) \
    \
    v(Int32, thresholdForOptimizeAfterWarmUp, 1000, Normal, nullptr) \
    v(Int32, thresholdForOptimizeAfterLongWarmUp, 1000, Normal, nullptr) \
    v(Int32, thresholdForOptimizeSoon, 1000, Normal, nullptr) \
    v(Int32, executionCounterIncrementForLoop, 1, Normal, nullptr) \
    v(Int32, executionCounterIncrementForEntry, 15, Normal, nullptr) \
    \
    v(Int32, thresholdForFTLOptimizeAfterWarmUp, 60000, Normal, nullptr) \
    v(Int32, thresholdForFTLOptimizeSoon, 1000, Normal, nullptr) \
    v(Int32, ftlTierUpCounterIncrementForLoop, 1, Normal, nullptr) \
    v(Int32, ftlTierUpCounterIncrementForReturn, 15, Normal, nullptr) \
    v(Unsigned, ftlOSREntryFailureCountForReoptimization, 15, Normal, nullptr) \
    v(Unsigned, ftlOSREntryRetryThreshold, 100, Normal, nullptr) \
    \
    v(Int32, evalThresholdMultiplier, 10, Normal, nullptr) \
    v(Unsigned, maximumEvalCacheableSourceLength, 256, Normal, nullptr) \
    \
    v(Int32, maximumExecutionCountsBetweenCheckpointsForBaseline, 1000, Normal, nullptr) \
    v(Int32, maximumExecutionCountsBetweenCheckpointsForUpperTiers, 30000, Normal, nullptr) \
    v(Int32, highCostBaselineProfilingFunctionBytecodeCost, 10000, Normal, nullptr) \
    \
    v(Unsigned, likelyToTakeSlowCaseMinimumCount, 20, Normal, nullptr) \
    v(Unsigned, couldTakeSlowCaseMinimumCount, 10, Normal, nullptr) \
    \
    v(Unsigned, osrExitCountForReoptimization, 100, Normal, nullptr) \
    v(Unsigned, osrExitCountForReoptimizationFromLoop, 5, Normal, nullptr) \
    \
    v(Unsigned, reoptimizationRetryCounterMax, 0, Normal, nullptr)  \
    \
    v(Unsigned, minimumOptimizationDelay, 1, Normal, nullptr) \
    v(Unsigned, maximumOptimizationDelay, 5, Normal, nullptr) \
    v(Double, desiredProfileLivenessRate, 0.75, Normal, nullptr) \
    v(Double, desiredProfileFullnessRate, 0.35, Normal, nullptr) \
    \
    v(Double, doubleVoteRatioForDoubleFormat, 2, Normal, nullptr) \
    v(Double, structureCheckVoteRatioForHoisting, 1, Normal, nullptr) \
    v(Double, checkArrayVoteRatioForHoisting, 1, Normal, nullptr) \
    \
    v(Unsigned, maximumDirectCallStackSize, 200, Normal, nullptr) \
    \
    v(Unsigned, minimumNumberOfScansBetweenRebalance, 100, Normal, nullptr) \
    v(Unsigned, numberOfGCMarkers, computeNumberOfGCMarkers(8), Normal, nullptr) \
    v(Bool, useParallelMarkingConstraintSolver, true, Normal, nullptr) \
    v(Unsigned, opaqueRootMergeThreshold, 1000, Normal, nullptr) \
    v(Unsigned, maxHeapSizeAsRAMSizeMultiple, 0, Normal, nullptr) \
    v(Double, minHeapUtilization, 0.8, Normal, nullptr) \
    v(Double, minMarkedBlockUtilization, 0.9, Normal, nullptr) \
    v(Unsigned, slowPathAllocsBetweenGCs, 0, Normal, "force a GC on every Nth slow path alloc, where N is specified by this option"_s) \
    \
    v(Double, percentCPUPerMBForFullTimer, 0.0003125, Normal, nullptr) \
    v(Double, percentCPUPerMBForEdenTimer, 0.0025, Normal, nullptr) \
    v(Double, collectionTimerMaxPercentCPU, 0.05, Normal, nullptr) \
    \
    v(Bool, forceWeakRandomSeed, false, Normal, nullptr) \
    v(Unsigned, forcedWeakRandomSeed, 0, Normal, nullptr) \
    \
    v(Bool, alwaysHaveABadTime, false, Normal, "debugging option to test HaveABadTime mode"_s) \
    v(Bool, allowDoubleShape, true, Normal, "debugging option to test disabling use of DoubleShape"_s) \
    v(Bool, useZombieMode, false, Normal, "debugging option to scribble over dead objects with 0xbadbeef0"_s) \
    v(Bool, useImmortalObjects, false, Normal, "debugging option to keep all objects alive forever"_s) \
    v(Bool, sweepSynchronously, false, Normal, "debugging option to sweep all dead objects synchronously at GC end before resuming mutator"_s) \
    v(Unsigned, maxSingleAllocationSize, 0, Configurable, "debugging option to limit individual allocations to a max size (0 = limit not set, N = limit size in bytes)"_s) \
    \
    v(GCLogLevel, logGC, GCLogging::None, Normal, "debugging option to log GC activity (0 = None, 1 = Basic, 2 = Verbose)"_s) \
    v(Bool, useGC, true, Normal, nullptr) \
    v(Bool, useGlobalGC, false, Normal, nullptr) \
    v(Bool, gcAtEnd, false, Normal, "If true, the jsc CLI will do a GC before exiting"_s) \
    v(Bool, forceGCSlowPaths, false, Normal, "If true, we will force all JIT fast allocations down their slow paths."_s) \
    v(Bool, forceDidDeferGCWork, false, Normal, "If true, we will force all DeferGC destructions to perform a GC."_s) \
    v(Unsigned, gcMaxHeapSize, 0, Normal, nullptr) \
    v(Unsigned, forceRAMSize, 0, Normal, nullptr) \
    v(Bool, recordGCPauseTimes, false, Normal, nullptr) \
    v(Bool, dumpHeapStatisticsAtVMDestruction, false, Normal, nullptr) \
    v(Bool, enableStrongRefTracker, false, Normal, "Enable logging of live Strong<*> values. Use alongside $vm.triggerMemoryPressure() and dumpHeapOnLowMemory."_s) \
    v(Bool, dumpHeapOnLowMemory, false, Normal, "Dump a heap dump when the memory handler is triggered. Use alongside $vm.triggerMemoryPressure() and enableStrongRefTracker."_s) \
    v(Bool, forceCodeBlockToJettisonDueToOldAge, false, Normal, "If true, this means that anytime we can jettison a CodeBlock due to old age, we do."_s) \
    v(Bool, useEagerCodeBlockJettisonTiming, false, Normal, "If true, the time slices for jettisoning a CodeBlock due to old age are shrunk significantly."_s) \
    \
    v(Bool, useTypeProfiler, false, Normal, nullptr) \
    v(Bool, useControlFlowProfiler, false, Normal, nullptr) \
    \
    v(Bool, useSamplingProfiler, false, Normal, nullptr) \
    v(Unsigned, sampleInterval, 1000, Normal, "Time between stack traces in microseconds."_s) \
    v(Bool, collectExtraSamplingProfilerData, false, Normal, "This corresponds to the JSC shell's --sample option, or if we're wanting to use the sampling profiler via the Debug menu in the browser."_s) \
    v(Unsigned, samplingProfilerTopFunctionsCount, 12, Normal, "Number of top functions to report when using the command line interface."_s) \
    v(Unsigned, samplingProfilerTopBytecodesCount, 40, Normal, "Number of top bytecodes to report when using the command line interface."_s) \
    v(Bool, samplingProfilerIgnoreExternalSourceID, false, Normal, "Ignore external source ID when aggregating results from sampling profiler"_s) \
    v(OptionString, samplingProfilerPath, nullptr, Normal, "The path to the directory to write sampiling profiler output to. This probably will not work with WK2 unless the path is in the sandbox."_s) \
    v(Bool, sampleCCode, false, Normal, "Causes the sampling profiler to record profiling data for C frames."_s) \
    \
    v(Bool, alwaysGeneratePCToCodeOriginMap, false, Normal, "This will make sure we always generate a PCToCodeOriginMap for JITed code."_s) \
    \
    v(Double, randomIntegrityAuditRate, 0.05, Normal, "Probability of random integrity audits [0.0 - 1.0]"_s) \
    v(Bool, verifyGC, false, Normal, nullptr) \
    v(Bool, verboseVerifyGC, false, Normal, nullptr) \
    v(Bool, verifyHeap, false, Normal, nullptr) \
    v(Unsigned, numberOfGCCyclesToRecordForVerification, 3, Normal, nullptr) \
    \
    v(Unsigned, exceptionStackTraceLimit, 100, Normal, "Stack trace limit for internal Exception object"_s) \
    v(Unsigned, defaultErrorStackTraceLimit, 100, Normal, "The default value for Error.stackTraceLimit"_s) \
    v(Bool, exitOnResourceExhaustion, false, Normal, nullptr) \
    v(Bool, useExceptionFuzz, false, Normal, nullptr) \
    v(Unsigned, fireExceptionFuzzAt, 0, Normal, nullptr) \
    v(Bool, validateDFGExceptionHandling, ASSERT_ENABLED, Normal, "Causes the DFG to emit code validating exception handling for each node that can exit"_s) \
    v(Bool, dumpSimulatedThrows, false, Normal, "Dumps the call stack of the last simulated throw if exception scope verification fails"_s) \
    v(Bool, validateExceptionChecks, false, Normal, "Verifies that needed exception checks are performed."_s) \
    v(Unsigned, unexpectedExceptionStackTraceLimit, 100, Normal, "Stack trace limit for debugging unexpected exceptions observed in the VM"_s) \
    \
    v(Bool, validateDFGClobberize, false, Normal, "Emits code in the DFG/FTL to validate the Clobberize phase"_s) \
    v(Bool, validateBoundsCheckElimination, false, Normal, "Emits code in the DFG/FTL to validate bounds check elimination"_s) \
    \
    v(Bool, validateVMEntryCalleeSaves, false, Configurable, "Causes vmEntryToJavaScript to validate VMEntry callee saves are properly restored"_s) \
    \
    v(Bool, useExecutableAllocationFuzz, false, Normal, nullptr) \
    v(Unsigned, fireExecutableAllocationFuzzAt, 0, Normal, nullptr) \
    v(Unsigned, fireExecutableAllocationFuzzAtOrAfter, 0, Normal, nullptr) \
    v(Bool, fireExecutableAllocationFuzzRandomly, false, Normal, nullptr) \
    v(Double, fireExecutableAllocationFuzzRandomlyProbability, 0.1, Normal, nullptr) \
    v(Bool, verboseExecutableAllocationFuzz, false, Normal, nullptr) \
    v(Bool, zeroExecutableMemoryOnFree, false, Normal, "0 out instructions when freeing JIT memory."_s) \
    \
    v(Bool, useOSRExitFuzz, false, Normal, nullptr) \
    v(Unsigned, fireOSRExitFuzzAtStatic, 0, Normal, nullptr) \
    v(Unsigned, fireOSRExitFuzzAt, 0, Normal, nullptr) \
    v(Unsigned, fireOSRExitFuzzAtOrAfter, 0, Normal, nullptr) \
    v(Bool, verboseOSRExitFuzz, true, Normal, nullptr) \
    \
    v(Unsigned, seedOfVMRandomForFuzzer, 0, Normal, "0 means not fuzzing this; use a cryptographically random seed"_s) \
    v(Bool, useRandomizingFuzzerAgent, false, Normal, nullptr) \
    v(Unsigned, seedOfRandomizingFuzzerAgent, 1, Normal, nullptr) \
    v(Bool, dumpFuzzerAgentPredictions, false, Normal, nullptr) \
    v(Bool, useDoublePredictionFuzzerAgent, false, Normal, nullptr) \
    v(Bool, useFileBasedFuzzerAgent, false, Normal, nullptr) \
    v(Bool, usePredictionFileCreatingFuzzerAgent, false, Normal, nullptr) \
    v(Bool, requirePredictionForFileBasedFuzzerAgent, false, Normal, nullptr) \
    v(OptionString, fuzzerPredictionsFile, nullptr, Normal, "file with list of predictions for FileBasedFuzzerAgent"_s) \
    v(Bool, useNarrowingNumberPredictionFuzzerAgent, false, Normal, nullptr) \
    v(Bool, useWideningNumberPredictionFuzzerAgent, false, Normal, nullptr) \
    \
    v(Bool, logPhaseTimes, false, Normal, nullptr) \
    v(Double, rareBlockPenalty, 0.001, Normal, nullptr) \
    v(Unsigned, maximumTmpsForGraphColoring, 60000, Normal, "The maximum number of tmps an Air program can have before always register allocating with Linear Scan"_s) \
    v(Bool, airLinearScanVerbose, false, Normal, nullptr) \
    v(Bool, airLinearScanSpillsEverything, false, Normal, nullptr) \
    v(Bool, airForceBriggsAllocator, false, Normal, nullptr) \
    v(Bool, airForceIRCAllocator, false, Normal, nullptr) \
    v(Bool, airRandomizeRegs, false, Normal, nullptr) \
    v(Unsigned, airRandomizeRegsSeed, 0, Normal, nullptr) \
    v(Bool, coalesceSpillSlots, true, Normal, nullptr) \
    v(Bool, logAirRegisterPressure, false, Normal, nullptr) \
    v(Bool, useB3TailDup, true, Normal, nullptr) \
    v(Unsigned, maxB3TailDupBlockSize, 3, Normal, nullptr) \
    v(Unsigned, maxB3TailDupBlockSuccessors, 3, Normal, nullptr) \
    v(Bool, useB3HoistLoopInvariantValues, true, Normal, nullptr) \
    v(Bool, useB3CanonicalizePrePostIncrements, false, Normal, nullptr) \
    v(Bool, useAirOptimizePairedLoadStore, true, Normal, nullptr) \
    \
    v(Bool, useDollarVM, false, Restricted, "installs the $vm debugging tool in global objects"_s) \
    v(OptionString, functionOverrides, nullptr, Restricted, "file with debugging overrides for function bodies"_s) \
    \
    v(Unsigned, watchdog, 0, Normal, "watchdog timeout (0 = Disabled, N = a timeout period of N milliseconds)"_s) \
    v(Bool, usePollingTraps, false, Normal, "use polling (instead of signalling) VM traps"_s) \
    \
    v(Bool, useMachForExceptions, true, Normal, "Use mach exceptions rather than signals to handle faults and pass thread messages. (This does nothing on platforms without mach)"_s) \
    v(Bool, allowNonSPTagging, true, Normal, "allow use of the pacib instruction instead of just pacibsp (This can break lldb/posix signals as it puts live data below SP)"_s) \
    \
    v(Bool, useICStats, false, Normal, nullptr) \
    \
    v(Unsigned, prototypeHitCountForLLIntCaching, 2, Normal, "Number of prototype property hits before caching a prototype in the LLInt. A count of 0 means never cache."_s) \
    \
    v(Bool, dumpCompiledRegExpPatterns, false, Normal, nullptr) \
    v(Bool, verboseRegExpCompilation, false, Normal, nullptr) \
    \
    v(Bool, dumpModuleRecord, false, Normal, nullptr) \
    v(Bool, dumpModuleLoadingState, false, Normal, nullptr) \
    v(Bool, exposeInternalModuleLoader, false, Normal, "expose the internal module loader object to the global space for debugging"_s) \
    \
    v(Bool, exposePrivateIdentifiers, false, Normal, "Allow non-builtin scripts to use private identifiers. Mostly useful to expose @superSamplerBegin/End intrinsics for profiling"_s) \
    \
    v(Bool, useSuperSampler, false, Normal, nullptr) \
    \
    v(Bool, useSourceProviderCache, true, Normal, "If false, the parser will not use the source provider cache. It's good to verify everything works when this is false. Because the cache is so successful, it can mask bugs."_s) \
    v(Bool, useCodeCache, true, Normal, "If false, the unlinked byte code cache will not be used."_s) \
    \
    v(Bool, useWasm, true, Normal, "Expose the Wasm global object."_s) \
    \
    v(Bool, failToCompileWasmCode, false, Normal, "If true, no Wasm::Plan will sucessfully compile a function."_s) \
    v(Size, wasmPartialCompileLimit, 5000, Normal, "Limit on the number of bytes a Wasm::Plan::compile should attempt before checking for other work."_s) \
    v(Unsigned, wasmOMGOptimizationLevel, Options::defaultB3OptLevel(), Normal, "B3 Optimization level for OMG Web Assembly module compilations."_s) \
    \
    v(Bool, useBBQTierUpChecks, true, Normal, "Enables tier up checks for our BBQ code."_s) \
    v(Bool, useWasmOSR, true, Normal, nullptr) \
    v(Int32, thresholdForBBQOptimizeAfterWarmUp, 150, Normal, "The count before we tier up a function to BBQ."_s) \
    v(Int32, thresholdForBBQOptimizeSoon, 50, Normal, nullptr) \
    v(Int32, thresholdForOMGOptimizeAfterWarmUp, 50000, Normal, "The count before we tier up a function to OMG."_s) \
    v(Int32, thresholdForOMGOptimizeSoon, 500, Normal, nullptr) \
    v(Unsigned, maximumOMGCandidateCost, 40000, Normal, nullptr) \
    v(Int32, omgTierUpCounterIncrementForLoop, 1, Normal, "The amount the tier up counter is incremented on each loop backedge."_s) \
    v(Int32, omgTierUpCounterIncrementForEntry, 15, Normal, "The amount the tier up counter is incremented on each function entry."_s) \
    v(Bool, useWasmFastMemory, true, Normal, "If true, we will try to use a 32-bit address space with a signal handler to bounds check wasm memory."_s) \
    v(Bool, logWasmMemory, false, Normal, nullptr) \
    v(Unsigned, wasmFastMemoryRedzonePages, 128, Normal, "Wasm fast memories use 4GiB virtual allocations, plus a redzone (counted as multiple of 64KiB Wasm pages) at the end to catch reg+imm accesses which exceed 32-bit, anything beyond the redzone is explicitly bounds-checked"_s) \
    v(Bool, crashIfWasmCantFastMemory, false, Normal, "If true, we will crash if we can't obtain fast memory for wasm."_s) \
    v(Bool, crashOnFailedWasmValidate, false, Normal, "If true, we will crash if we can't validate a wasm module instead of throwing an exception."_s) \
    v(Unsigned, maxNumWasmFastMemories, hasCapacityToUseLargeGigacage() ? 8 : 3, Normal, nullptr) \
    v(Bool, verboseBBQJITAllocation, false, Normal, "Logs extra information about register allocation during BBQ JIT"_s) \
    v(Bool, verboseBBQJITInstructions, false, Normal, "Logs instruction information during BBQ JIT"_s) \
    v(Bool, useWasmLLInt, true, Normal, nullptr) \
    v(Bool, useBBQJIT, true, Normal, "allows the BBQ JIT to be used if true"_s) \
    v(Bool, useOMGJIT, !isARM_THUMB2(), Normal, "allows the OMG JIT to be used if true"_s) \
    v(Bool, useWasmLLIntPrologueOSR, true, Normal, "allows prologue OSR from wasm LLInt if true"_s) \
    v(Bool, useWasmLLIntLoopOSR, true, Normal, "allows loop OSR from wasm LLInt if true"_s) \
    v(Bool, useWasmLLIntEpilogueOSR, true, Normal, "allows epilogue OSR from wasm LLInt if true"_s) \
    v(OptionRange, wasmFunctionIndexRangeToCompile, nullptr, Normal, "wasm function index range to allow compilation on, e.g. 1:100"_s) \
    v(Bool, useEagerWasmModuleHashing, false, Normal, "Unnamed Wasm modules are identified in backtraces through their hash, if available."_s) \
    v(Bool, useArrayAllocationProfiling, true, Normal, "If true, we will use our normal array allocation profiling. If false, the allocation profile will always claim to be undecided."_s) \
    v(Bool, forcePolyProto, false, Normal, "If true, create_this will always create an object with a poly proto structure."_s) \
    v(Bool, forceMiniVMMode, false, Normal, "If true, it will force mini VM mode on."_s) \
    v(Bool, useTracePoints, false, Normal, nullptr) \
    v(Bool, useCompilerSignpost, false, Normal, nullptr) \
    v(Bool, traceLLIntExecution, false, Configurable, nullptr) \
    v(Bool, traceWasmLLIntExecution, false, Configurable, nullptr) \
    v(Bool, traceLLIntSlowPath, false, Configurable, nullptr) \
    v(Bool, traceBaselineJITExecution, false, Normal, nullptr) \
    v(Unsigned, thresholdForGlobalLexicalBindingEpoch, UINT_MAX, Normal, "Threshold for global lexical binding epoch. If the epoch reaches to this value, CodeBlock metadata for scope operations will be revised globally. It needs to be greater than 1."_s) \
    v(OptionString, diskCachePath, nullptr, Restricted, nullptr) \
    v(Bool, forceDiskCache, false, Restricted, nullptr) \
    v(Bool, validateAbstractInterpreterState, false, Restricted, nullptr) \
    v(Double, validateAbstractInterpreterStateProbability, 0.5, Normal, nullptr) \
    v(OptionString, dumpJITMemoryPath, nullptr, Restricted, nullptr) \
    v(Double, dumpJITMemoryFlushInterval, 10, Restricted, "Maximum time in between flushes of the JIT memory dump in seconds."_s) \
    v(Bool, useUnlinkedCodeBlockJettisoning, false, Normal, "If true, UnlinkedCodeBlock can be jettisoned."_s) \
    v(Bool, forceOSRExitToLLInt, false, Normal, "If true, we always exit to the LLInt. If false, we exit to whatever is most convenient."_s) \
    v(Unsigned, getByValICMaxNumberOfIdentifiers, 4, Normal, "Number of identifiers we see in the LLInt that could cause us to bail on generating an IC for get_by_val."_s) \
    v(Bool, useRandomizingExecutableIslandAllocation, false, Normal, "For the arm64 ExecutableAllocator, if true, select which region to use randomly. This is useful for testing that jump islands work."_s) \
    v(Bool, exposeProfilersOnGlobalObject, false, Normal, "If true, we will expose functions to enable/disable both the sampling profiler and the super sampler"_s) \
    v(Bool, allowUnsupportedTiers, false, Normal, "If true, we will not disable DFG or FTL when an experimental feature is enabled."_s) \
    v(Bool, returnEarlyFromInfiniteLoopsForFuzzing, false, Normal, nullptr) \
    v(Size, earlyReturnFromInfiniteLoopsLimit, 1300000000, Normal, "When returnEarlyFromInfiniteLoopsForFuzzing is true, this determines the number of executions a loop can run for before just returning. This is helpful for the fuzzer so it doesn't get stuck in infinite loops."_s) \
    v(Bool, useLICMFuzzing, false, Normal, nullptr) \
    v(Unsigned, seedForLICMFuzzer, 424242, Normal, nullptr) \
    v(Double, allowHoistingLICMProbability, 0.5, Normal, nullptr) \
    v(Bool, exposeCustomSettersOnGlobalObjectForTesting, false, Normal, nullptr) \
    v(Bool, useJITCage, canUseJITCage(), Normal, nullptr) \
    v(Bool, useAllocationProfiling, false, Normal, "Allows toggling of bmalloc/libPAS allocation profiling features at JSC launch."_s) \
    v(Unsigned, allocationProfilingMode, 0, Normal, "Allows custom arguments to be passed to bmalloc/libPAS allocation profiling features at JSC launch."_s) \
    v(Bool, dumpBaselineJITSizeStatistics, false, Normal, nullptr) \
    v(Bool, dumpDFGJITSizeStatistics, false, Normal, nullptr) \
    v(Bool, useLoopUnrolling, true, Normal, nullptr) \
    v(Bool, verboseLoopUnrolling, false, Normal, nullptr) \
    v(Unsigned, maxLoopUnrollingCount, 2, Normal, nullptr) \
    v(Unsigned, maxLoopUnrollingBodyNodeSize, 200, Normal, nullptr) \
    v(Unsigned, maxLoopUnrollingIterationCount, 4, Normal, nullptr) \
    v(Bool, printEachUnrolledLoop, false, Normal, nullptr) \
    v(Bool, verboseExecutablePoolAllocation, false, Normal, nullptr) \
    v(Bool, useHandlerIC, canUseHandlerIC(), Normal, nullptr) \
    v(Bool, useDataICInFTL, false, Normal, nullptr) \
    v(Bool, useDataICSharing, false, Normal, nullptr) \
    v(Bool, useLLIntICs, true, Normal, "Use property and call ICs in LLInt code."_s) \
    v(Bool, useBaselineJITCodeSharing, is64Bit(), Normal, nullptr) \
    v(Bool, libpasScavengeContinuously, false, Normal, nullptr) \
    v(Bool, useWasmFaultSignalHandler, true, Normal, nullptr) \
    v(Bool, dumpUnlinkedDFGValidation, false, Normal, nullptr) \
    v(Bool, dumpWasmOpcodeStatistics, false, Normal, nullptr) \
    v(Bool, dumpWasmWarnings, false, Normal, nullptr) \
    v(Bool, useRecursiveJSONParse, true, Normal, nullptr) \
    v(Unsigned, thresholdForStringReplaceCache, 0x1000, Normal, nullptr) \
    v(Bool, useWasmIPInt, false, Normal, "Use the in-place interpereter for WASM instead of LLInt."_s) \
    v(Bool, useWasmIPIntPrologueOSR, true, Normal, "Allow IPInt to tier up during function prologues"_s) \
    v(Bool, useWasmIPIntLoopOSR, true, Normal, "Allow IPInt to tier up during loop iterations"_s) \
    v(Bool, useWasmIPIntEpilogueOSR, true, Normal, "Allow IPInt to tier up during function epilogues"_s) \
    v(Bool, forceAllFunctionsToUseSIMD, false, Normal, "Force all functions to act conservatively w.r.t fp/vector registers for testing."_s) \
    v(Bool, useOMGInlining, true, Normal, "Use OMG inlining"_s) \
    v(Bool, freeRetiredWasmCode, true, Normal, "free BBQ/OMG-OSR wasm code once it's no longer reachable."_s) \
    \
    /* Feature Flags */\
    \
    v(Bool, useAtomicsPause, true, Normal, "Expose Atomics.pause."_s) \
    v(Bool, useErrorIsError, true, Normal, "Expose Error.isError feature."_s) \
    v(Bool, useFloat16Array, true, Normal, "Expose Float16Array."_s) \
    v(Bool, useImportDefer, false, Normal, "Enable deferred module import."_s) \
    v(Bool, useIteratorChunking, false, Normal, "Expose the Iterator.prototype.chunks and Iterator.prototype.windows methods."_s) \
    v(Bool, useIteratorHelpers, true, Normal, "Expose the Iterator Helpers."_s) \
    v(Bool, useIteratorSequencing, false, Normal, "Expose the Iterator.concat method."_s) \
    v(Bool, useMapGetOrInsert, false, Normal, "Expose the Map.prototype.getOrInsert family of methods."_s) \
    v(Bool, useMathSumPreciseMethod, false, Normal, "Expose the Math.sumPrecise() method."_s) \
    v(Bool, useMoreCurrencyDisplayChoices, false, Normal, "Enable more currencyDisplay choices for Intl.NumberFormat"_s) \
    v(Bool, usePromiseTryMethod, true, Normal, "Expose the Promise.try() method."_s) \
    v(Bool, useRegExpEscape, true, Normal, "Expose RegExp.escape feature."_s) \
    v(Bool, useSharedArrayBuffer, false, Normal, nullptr) \
    v(Bool, useShadowRealm, false, Normal, "Expose the ShadowRealm object."_s) \
    v(Bool, useTemporal, false, Normal, "Expose the Temporal object."_s) \
    v(Bool, useTrustedTypes, false, Normal, "Enable trusted types eval protection feature."_s) \
    v(Bool, useUint8ArrayBase64Methods, true, Normal, "Expose methods for converting Uint8Array to/from base64 and hex."_s) \
    v(Bool, useWasmGC, true, Normal, "Allow gc types from the wasm gc proposal."_s) \
    v(Bool, useWasmSIMD, true, Normal, "Allow the new simd instructions and types from the wasm simd spec."_s) \
    v(Bool, useWasmRelaxedSIMD, false, Normal, "Allow the relaxed simd instructions and types from the wasm relaxed simd spec."_s) \
    v(Bool, useWasmTailCalls, true, Normal, "Allow the new instructions from the wasm tail calls spec."_s) \
    v(Unsigned, markedBlockDumpInfoCount, 0, Normal, nullptr) /* FIXME: rdar://139998916 */ \



enum OptionEquivalence {
    SameOption,
    InvertedOption,
};

#define FOR_EACH_JSC_ALIASED_OPTION(v) \
    v(enableFunctionDotArguments, useFunctionDotArguments, SameOption) \
    v(enableTailCalls, useTailCalls, SameOption) \
    v(showDisassembly, dumpDisassembly, SameOption) \
    v(showDFGDisassembly, dumpDFGDisassembly, SameOption) \
    v(showFTLDisassembly, dumpFTLDisassembly, SameOption) \
    v(dumpGraphAtEachDFGFTLPhase, dumpDFGFTLGraphAtEachPhase, SameOption) \
    v(dumpGraphAtEachDFGPhase, dumpDFGGraphAtEachPhase, SameOption) \
    v(dumpGraphAtEachB3Phase, dumpB3GraphAtEachPhase, SameOption) \
    v(dumpGraphAtEachAirPhase, dumpAirGraphAtEachPhase, SameOption) \
    v(alwaysDoFullCollection, useGenerationalGC, InvertedOption) \
    v(enableOSREntryToDFG, useOSREntryToDFG, SameOption) \
    v(enableOSREntryToFTL, useOSREntryToFTL, SameOption) \
    v(enableAccessInlining, useAccessInlining, SameOption) \
    v(enablePolyvariantDevirtualization, usePolyvariantDevirtualization, SameOption) \
    v(enablePolymorphicAccessInlining, usePolymorphicAccessInlining, SameOption) \
    v(enablePolymorphicCallInlining, usePolymorphicCallInlining, SameOption) \
    v(enableObjectAllocationSinking, useObjectAllocationSinking, SameOption) \
    v(enableConcurrentJIT, useConcurrentJIT, SameOption) \
    v(enableProfiler, useProfiler, SameOption) \
    v(enableArchitectureSpecificOptimizations, useArchitectureSpecificOptimizations, SameOption) \
    v(objectsAreImmortal, useImmortalObjects, SameOption) \
    v(disableGC, useGC, InvertedOption) \
    v(enableTypeProfiler, useTypeProfiler, SameOption) \
    v(enableControlFlowProfiler, useControlFlowProfiler, SameOption) \
    v(enableExceptionFuzz, useExceptionFuzz, SameOption) \
    v(enableExecutableAllocationFuzz, useExecutableAllocationFuzz, SameOption) \
    v(enableOSRExitFuzz, useOSRExitFuzz, SameOption) \
    v(enableDollarVM, useDollarVM, SameOption) \
    v(maximumOptimizationCandidateInstructionCount, maximumOptimizationCandidateBytecodeCost, SameOption) \
    v(maximumFTLCandidateInstructionCount, maximumFTLCandidateBytecodeCost, SameOption) \
    v(maximumInliningCallerSize, maximumInliningCallerBytecodeCost, SameOption) \
    v(validateBCE, validateBoundsCheckElimination, SameOption) \


enum ExperimentalOptionFlags {
    LLIntAndBaselineOnly = 0,
    SupportsDFG = 1 << 0,
    SupportsFTL = 1 << 1,
};

#define FOR_EACH_JSC_EXPERIMENTAL_OPTION(v) \

constexpr size_t countNumberOfJSCOptions()
{
#define COUNT_OPTION(type_, name_, defaultValue_, availability_, description_) count++;
    size_t count = 0;
    FOR_EACH_JSC_OPTION(COUNT_OPTION);
    return count;
#undef COUNT_OPTION
}

constexpr size_t NumberOfOptions = countNumberOfJSCOptions();

class OptionRange {
private:
    enum RangeState { Uninitialized, InitError, Normal, Inverted };
public:
    OptionRange() = default;
    OptionRange(std::nullptr_t) { }

    bool init(const char*);
    bool isInRange(unsigned) const;
    const char* rangeString() const { return (m_state > InitError) ? m_rangeString : s_nullRangeStr; }

    void dump(PrintStream& out) const;

private:
    static const char* const s_nullRangeStr;

    RangeState m_state { Uninitialized };
    const char* m_rangeString { nullptr };
    unsigned m_lowLimit { 0 };
    unsigned m_highLimit { 0 };
};

enum class OSLogType : uint8_t {
    None,
    // These corresponds to OS_LOG_TYPE_xxx.
    Default,
    Info,
    Debug,
    Error,
    Fault
};

struct OptionsStorage {
    using Bool = bool;
    using Unsigned = unsigned;
    using Double = double;
    using Int32 = int32_t;
    using Size = size_t;
    using OptionRange = JSC::OptionRange;
    using OptionString = const char*;
    using GCLogLevel = GCLogging::Level;
    using OSLogType = JSC::OSLogType;

    bool allowUnfinalizedAccess;
    bool isFinalized;

#define DECLARE_OPTION(type_, name_, defaultValue_, availability_, description_) \
    type_ name_;
FOR_EACH_JSC_OPTION(DECLARE_OPTION)
#undef DECLARE_OPTION
};

// Options::Metadata's offsetOfOption and offsetOfOptionDefault relies on this.
static_assert(sizeof(OptionsStorage) <= 16 * KB);

} // namespace JSC
