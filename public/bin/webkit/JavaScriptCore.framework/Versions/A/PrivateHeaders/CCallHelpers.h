/*
 * Copyright (C) 2011-2020 Apple Inc. All rights reserved.
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

#if ENABLE(JIT)

#include "AssemblyHelpers.h"
#include "FPRInfo.h"
#include "GPRInfo.h"
#include "OperationResult.h"
#include "StackAlignment.h"
#include <wtf/FunctionTraits.h>
#include <wtf/ScopedLambda.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

#define POKE_ARGUMENT_OFFSET 0

class CallFrame;
class Structure;
namespace DFG {
class RegisteredStructure;
};

class CCallHelpers : public AssemblyHelpers {
    WTF_MAKE_TZONE_ALLOCATED(CCallHelpers);
public:
    CCallHelpers(CodeBlock* codeBlock = nullptr)
        : AssemblyHelpers(codeBlock)
    {
    }

    // Wrapper to encode JSCell GPR into JSValue.
    class CellValue {
    public:
        explicit CellValue(GPRReg gpr)
            : m_gpr(gpr)
        {
        }

        GPRReg gpr() const { return m_gpr; }

    private:
        GPRReg m_gpr;
    };

    // Base class for constant materializers.
    // It offers DerivedClass::materialize and poke functions.
    class ConstantMaterializer { };

    // The most general helper for setting arguments that fit in a GPR, if you can compute each
    // argument without using any argument registers. You usually want one of the setupArguments*()
    // methods below instead of this. This thing is most useful if you have *a lot* of arguments.
    template<typename Functor>
    void setupArgument(unsigned argumentIndex, const Functor& functor)
    {
        unsigned numberOfRegs = GPRInfo::numberOfArgumentRegisters; // Disguise the constant from clang's tautological compare warning.
        if (argumentIndex < numberOfRegs) {
            functor(GPRInfo::toArgumentRegister(argumentIndex));
            return;
        }

        functor(GPRInfo::nonArgGPR0);
        poke(GPRInfo::nonArgGPR0, POKE_ARGUMENT_OFFSET + argumentIndex - GPRInfo::numberOfArgumentRegisters);
    }

    template<typename RegType, unsigned NumberOfRegisters>
    ALWAYS_INLINE void shuffleRegisters(std::array<RegType, NumberOfRegisters> sources, std::array<RegType, NumberOfRegisters> destinations)
    {
        if (ASSERT_ENABLED) {
            RegisterSetBuilder set;
            for (RegType dest : destinations)
                set.add(dest, IgnoreVectors);
            ASSERT_WITH_MESSAGE(set.numberOfSetRegisters() == NumberOfRegisters, "Destinations should not be aliased.");
        }

        using RegPair = std::pair<RegType, RegType>;
        Vector<RegPair, NumberOfRegisters> pairs;

        // if constexpr avoids warnings when NumberOfRegisters is 0.
        if constexpr (NumberOfRegisters > 0) {
            for (unsigned i = 0; i < NumberOfRegisters; ++i) {
                if (sources[i] != destinations[i])
                    pairs.append(std::make_pair(sources[i], destinations[i]));
            }
        } else {
            // Silence some older compilers (GCC up to 9.X) about unused but set parameters.
            UNUSED_PARAM(sources);
            UNUSED_PARAM(destinations);
        }

#if ASSERT_ENABLED
        auto numUniqueSources = [&] () -> unsigned {
            RegisterSetBuilder set;
            for (auto& pair : pairs) {
                RegType source = pair.first;
                set.add(source, IgnoreVectors);
            }
            return set.numberOfSetRegisters();
        };

        auto numUniqueDests = [&] () -> unsigned {
            RegisterSetBuilder set;
            for (auto& pair : pairs) {
                RegType dest = pair.second;
                set.add(dest, IgnoreVectors);
            }
            return set.numberOfSetRegisters();
        };
#endif

        while (!pairs.isEmpty()) {
            RegisterSet freeDestinations;
            for (auto& pair : pairs) {
                RegType dest = pair.second;
                freeDestinations.add(dest, IgnoreVectors);
            }
            for (auto& pair : pairs) {
                RegType source = pair.first;
                freeDestinations.remove(source);
            }

            if (freeDestinations.numberOfSetRegisters()) {
                bool madeMove = false;
                for (unsigned i = 0; i < pairs.size(); i++) {
                    auto [source, dest] = pairs[i];
                    if (freeDestinations.contains(dest, IgnoreVectors)) {
                        // This means that this setup function cannot handle SIMD vectors as a part of parameters.
                        // Now, this is guaranteed that we ensure FP parameter is always `double`.
                        if constexpr (std::is_same_v<RegType, FPRReg>)
                            moveDouble(source, dest);
                        else
                            move(source, dest);
                        pairs.remove(i);
                        madeMove = true;
                        break;
                    }
                }
                ASSERT_UNUSED(madeMove, madeMove);
                continue;
            }

            ASSERT(numUniqueDests() == numUniqueSources());
            ASSERT(numUniqueDests() == pairs.size());
            // The set of source and destination registers are equivalent sets. This means we don't have
            // any free destination registers that won't also clobber a source. We get around this by
            // exchanging registers.

            auto [source, dest] = pairs.first();
            if constexpr (std::is_same_v<RegType, FPRReg>)
                swapDouble(source, dest);
            else
                swap(source, dest);
            pairs.remove(0);

            RegType newSource = source;
            for (auto& pair : pairs) {
                RegType source = pair.first;
                if (source == dest) {
                    pair.first = newSource;
                    break;
                }
            }

            // We may have introduced pairs that have the same source and destination. Remove those now.
            pairs.removeAllMatching([](const auto& pair) {
                return pair.first == pair.second;
            });
        }
    }

    template<unsigned NumberOfJSRs>
    ALWAYS_INLINE void shuffleJSRs(std::array<JSValueRegs, NumberOfJSRs> sources, std::array<JSValueRegs, NumberOfJSRs> destinations)
    {
#if USE(JSVALUE64)
        constexpr unsigned NumberOfRegisters = NumberOfJSRs;
#else
        constexpr unsigned NumberOfRegisters = NumberOfJSRs * 2;
#endif
        std::array<GPRReg, NumberOfRegisters> sourceRegs;
        std::array<GPRReg, NumberOfRegisters> destinationRegs;

        for (unsigned i = 0; i < NumberOfJSRs; ++i) {
            sourceRegs[i] = sources[i].payloadGPR();
            destinationRegs[i] = destinations[i].payloadGPR();
#if !USE(JSVALUE64)
            sourceRegs[i + NumberOfJSRs] = sources[i].tagGPR();
            destinationRegs[i + NumberOfJSRs] = destinations[i].tagGPR();
#endif
        }
        shuffleRegisters<GPRReg, NumberOfRegisters>(sourceRegs, destinationRegs);
    }

private:
    template<typename RegType>
    using InfoTypeForReg = decltype(toInfoFromReg(RegType(-1)));

    // extraGPRArgs is used to track 64-bit argument types passed in register on 32-bit architectures.
    // extraPoke is used to track 64-bit argument types passed on the stack.
    template<unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke>
    struct ArgCollection {
        ArgCollection()
        {
            gprSources.fill(InvalidGPRReg);
            gprDestinations.fill(InvalidGPRReg);
            fprSources.fill(InvalidFPRReg);
            fprDestinations.fill(InvalidFPRReg);
            crossSources.fill(InvalidFPRReg);
            crossDestinations.fill(InvalidGPRReg);
        }

        template<unsigned a, unsigned b, unsigned c, unsigned d, unsigned e, unsigned f, unsigned g, unsigned h>
        ArgCollection(ArgCollection<a, b, c, d, e, f, g, h>& other)
        {
            gprSources = other.gprSources;
            gprDestinations = other.gprDestinations;
            fprSources = other.fprSources;
            fprDestinations = other.fprDestinations;
            crossSources = other.crossSources;
            crossDestinations = other.crossDestinations;
        }

        ArgCollection<numGPRArgs + 1, numGPRSources + 1, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> pushRegArg(GPRReg argument, GPRReg destination)
        {
            ArgCollection<numGPRArgs + 1, numGPRSources + 1, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> result(*this);

            result.gprSources[numGPRSources] = argument;
            result.gprDestinations[numGPRSources] = destination;
            return result;
        }

        ArgCollection<numGPRArgs, numGPRSources, numFPRArgs + 1, numFPRSources + 1, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> pushRegArg(FPRReg argument, FPRReg destination)
        {
            ArgCollection<numGPRArgs, numGPRSources, numFPRArgs + 1, numFPRSources + 1, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> result(*this);

            result.fprSources[numFPRSources] = argument;
            result.fprDestinations[numFPRSources] = destination;
            return result;
        }

        ArgCollection<numGPRArgs, numGPRSources, numFPRArgs + 1, numFPRSources, numCrossSources + 1, extraGPRArgs, nonArgGPRs, extraPoke> pushRegArg(FPRReg argument, GPRReg destination)
        {
            ArgCollection<numGPRArgs, numGPRSources, numFPRArgs + 1, numFPRSources, numCrossSources + 1, extraGPRArgs, nonArgGPRs, extraPoke> result(*this);

            result.crossSources[numCrossSources] = argument;
            result.crossDestinations[numCrossSources] = destination;
            return result;
        }

        ArgCollection<numGPRArgs, numGPRSources + 1, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs + 1, nonArgGPRs, extraPoke> pushExtraRegArg(GPRReg argument, GPRReg destination)
        {
            ArgCollection<numGPRArgs, numGPRSources + 1, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs + 1, nonArgGPRs, extraPoke> result(*this);

            result.gprSources[numGPRSources] = argument;
            result.gprDestinations[numGPRSources] = destination;
            return result;
        }

        ArgCollection<numGPRArgs, numGPRSources + 1, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs + 1, extraPoke> pushNonArg(GPRReg argument, GPRReg destination)
        {
            ArgCollection<numGPRArgs, numGPRSources + 1, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs + 1, extraPoke> result(*this);

            result.gprSources[numGPRSources] = argument;
            result.gprDestinations[numGPRSources] = destination;
            return result;
        }

        ArgCollection<numGPRArgs + 1, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> addGPRArg()
        {
            return ArgCollection<numGPRArgs + 1, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke>(*this);
        }

        ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs + 1, nonArgGPRs, extraPoke> addGPRExtraArg()
        {
            return ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs + 1, nonArgGPRs, extraPoke>(*this);
        }

        ArgCollection<numGPRArgs + 1, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> addStackArg(GPRReg)
        {
            return ArgCollection<numGPRArgs + 1, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke>(*this);
        }

        ArgCollection<numGPRArgs, numGPRSources, numFPRArgs + 1, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> addStackArg(FPRReg)
        {
            return ArgCollection<numGPRArgs, numGPRSources, numFPRArgs + 1, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke>(*this);
        }

        ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke + 1> addPoke()
        {
            return ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke + 1>(*this);
        }

        unsigned argCount(GPRReg) { return numGPRArgs + extraGPRArgs; }
        unsigned argCount(FPRReg) { return numFPRArgs; }

        // store GPR -> GPR assignments
        std::array<GPRReg, GPRInfo::numberOfRegisters> gprSources;
        std::array<GPRReg, GPRInfo::numberOfRegisters> gprDestinations;

        // store FPR -> FPR assignments
        std::array<FPRReg, FPRInfo::numberOfRegisters> fprSources;
        std::array<FPRReg, FPRInfo::numberOfRegisters> fprDestinations;

        // store FPR -> GPR assignments
        std::array<FPRReg, GPRInfo::numberOfRegisters> crossSources;
        std::array<GPRReg, GPRInfo::numberOfRegisters> crossDestinations;
    };

    template<unsigned TargetSize, typename RegType>
    std::array<RegType, TargetSize> clampArrayToSize(std::array<RegType, InfoTypeForReg<RegType>::numberOfRegisters> sourceArray)
    {
        static_assert(TargetSize <= sourceArray.size(), "TargetSize is bigger than source.size()");
        RELEASE_ASSERT(TargetSize <= InfoTypeForReg<RegType>::numberOfRegisters);

        std::array<RegType, TargetSize> result { };

        // if constexpr avoids warnings when TargetSize is 0.
        if constexpr (TargetSize > 0) {
            for (unsigned i = 0; i < TargetSize; i++) {
                ASSERT(sourceArray[i] != static_cast<int32_t>(InfoTypeForReg<RegType>::InvalidIndex));
                result[i] = sourceArray[i];
            }
        }

        return result;
    }

    ALWAYS_INLINE unsigned calculatePokeOffset(unsigned currentGPRArgument, unsigned currentFPRArgument, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke)
    {
        // Clang claims that it cannot find the symbol for FPRReg/GPRReg::numberOfArgumentRegisters when they are passed directly to std::max... seems like a bug
        unsigned numberOfFPArgumentRegisters = FPRInfo::numberOfArgumentRegisters;
        unsigned numberOfGPArgumentRegisters = GPRInfo::numberOfArgumentRegisters;

        UNUSED_PARAM(nonArgGPRs);

        currentGPRArgument += extraGPRArgs;
        currentFPRArgument -= numCrossSources;

        IGNORE_WARNINGS_BEGIN("type-limits")
        ASSERT(currentGPRArgument >= GPRInfo::numberOfArgumentRegisters || currentFPRArgument >= FPRInfo::numberOfArgumentRegisters);
        IGNORE_WARNINGS_END

        unsigned pokeOffset = POKE_ARGUMENT_OFFSET + extraPoke;
        pokeOffset += std::max(currentGPRArgument, numberOfGPArgumentRegisters) - numberOfGPArgumentRegisters;
        pokeOffset += std::max(currentFPRArgument, numberOfFPArgumentRegisters) - numberOfFPArgumentRegisters;
        return pokeOffset;
    }

    template<typename ArgType>
    ALWAYS_INLINE void pokeForArgument(ArgType arg, unsigned currentGPRArgument, unsigned currentFPRArgument, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke)
    {
        unsigned pokeOffset = calculatePokeOffset(currentGPRArgument, currentFPRArgument, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
        if constexpr (std::is_base_of_v<ConstantMaterializer, ArgType>)
            arg.store(*this, addressForPoke(pokeOffset));
        else
            poke(arg, pokeOffset);
    }

    ALWAYS_INLINE bool stackAligned(unsigned currentGPRArgument, unsigned currentFPRArgument, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke)
    {
        unsigned pokeOffset = calculatePokeOffset(currentGPRArgument, currentFPRArgument, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
        return !(pokeOffset & 1);
    }

    // In the auto-calling convention code below the order of operations is:
    //    1) spill arguments to stack slots
    //    2) shuffle incomming argument values in registers to argument registers
    //    3) fill immediate values to argument registers
    // To do this, we recurse forwards through our args collecting argument values in registers and spilling stack slots.
    // when we run out of args we then run our shuffling code to relocate registers. Finally, as we unwind from our
    // recursion we can fill immediates.

#define CURRENT_ARGUMENT_TYPE typename FunctionTraits<OperationType>::template ArgumentType<numGPRArgs + numFPRArgs>
#define RESULT_TYPE typename FunctionTraits<OperationType>::ResultType

#if USE(JSVALUE64)

    // Avoid MSVC optimization time explosion associated with __forceinline in recursive templates.
    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename RegType, typename... Args>
    ALWAYS_INLINE void marshallArgumentRegister(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, RegType arg, Args... args)
    {
        using InfoType = InfoTypeForReg<RegType>;
        unsigned numArgRegisters = InfoType::numberOfArgumentRegisters;
        unsigned currentArgCount = argSourceRegs.argCount(arg);
        if (currentArgCount < numArgRegisters) {
            auto updatedArgSourceRegs = argSourceRegs.pushRegArg(arg, InfoType::toArgumentRegister(currentArgCount));
            setupArgumentsImpl<OperationType>(updatedArgSourceRegs, args...);
            return;
        }

        pokeForArgument(arg, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
        setupArgumentsImpl<OperationType>(argSourceRegs.addStackArg(arg), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    ALWAYS_INLINE void setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, FPRReg arg, Args... args)
    {
        static_assert(std::is_same_v<CURRENT_ARGUMENT_TYPE, double>, "We should only be passing FPRRegs to a double. We use moveDouble / loadDouble / storeDouble exclusively");
        marshallArgumentRegister<OperationType>(argSourceRegs, arg, args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    ALWAYS_INLINE void setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, GPRReg arg, Args... args)
    {
        marshallArgumentRegister<OperationType>(argSourceRegs, arg, args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    ALWAYS_INLINE void setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, JSValueRegs arg, Args... args)
    {
        marshallArgumentRegister<OperationType>(argSourceRegs, arg.gpr(), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    ALWAYS_INLINE void setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, CellValue arg, Args... args)
    {
        marshallArgumentRegister<OperationType>(argSourceRegs, arg.gpr(), args...);
    }

#else // USE(JSVALUE64)
#if CPU(ARM_THUMB2)

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    void setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, FPRReg arg, Args... args)
    {
        static_assert(std::is_same_v<CURRENT_ARGUMENT_TYPE, double>, "We should only be passing FPRRegs to a double. We use moveDouble / loadDouble / storeDouble exclusively");

        // ARM (hardfp, which we require) passes FP arguments in FP registers.
        unsigned numberOfFPArgumentRegisters = FPRInfo::numberOfArgumentRegisters;
        unsigned currentFPArgCount = argSourceRegs.argCount(arg);

        if (currentFPArgCount < numberOfFPArgumentRegisters) {
            auto updatedArgSourceRegs = argSourceRegs.pushRegArg(arg, FPRInfo::toArgumentRegister(currentFPArgCount));
            setupArgumentsImpl<OperationType>(updatedArgSourceRegs, args...);
            return;
        }

        // Otherwise pass FP argument on stack.
        if (stackAligned(numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke)) {
            pokeForArgument(arg, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
            setupArgumentsImpl<OperationType>(argSourceRegs.addStackArg(arg).addPoke(), args...);
        } else {
            pokeForArgument(arg, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke + 1);
            setupArgumentsImpl<OperationType>(argSourceRegs.addStackArg(arg).addPoke().addPoke(), args...);
        }
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    std::enable_if_t<sizeof(CURRENT_ARGUMENT_TYPE) <= 4>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, GPRReg arg, Args... args)
    {
        unsigned numArgRegisters = GPRInfo::numberOfArgumentRegisters;
        unsigned currentArgCount = argSourceRegs.argCount(arg);
        if (currentArgCount < numArgRegisters) {
            auto updatedArgSourceRegs = argSourceRegs.pushRegArg(arg, GPRInfo::toArgumentRegister(currentArgCount));
            setupArgumentsImpl<OperationType>(updatedArgSourceRegs, args...);
            return;
        }

        pokeForArgument(arg, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
        setupArgumentsImpl<OperationType>(argSourceRegs.addStackArg(arg), args...);
    }

    template<typename OperationType, typename Arg1, typename Arg2, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    void pokeArgumentsAligned(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg1 arg1, Arg2 arg2, Args... args)
    {
        unsigned numArgRegisters = GPRInfo::numberOfArgumentRegisters;
        unsigned currentArgCount = argSourceRegs.argCount(GPRInfo::regT0);

        if (currentArgCount + 1 == numArgRegisters) {
            pokeForArgument(arg1, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs + 1, nonArgGPRs, extraPoke);
            pokeForArgument(arg2, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs + 1, nonArgGPRs, extraPoke + 1);
            setupArgumentsImpl<OperationType>(argSourceRegs.addGPRExtraArg().addGPRArg().addPoke(), args...);
        } else if (stackAligned(numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke)) {
            pokeForArgument(arg1, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
            pokeForArgument(arg2, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke + 1);
            setupArgumentsImpl<OperationType>(argSourceRegs.addGPRArg().addPoke(), args...);
        } else {
            pokeForArgument(arg1, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke + 1);
            pokeForArgument(arg2, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke + 2);
            setupArgumentsImpl<OperationType>(argSourceRegs.addGPRArg().addPoke().addPoke(), args...);
        }
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    std::enable_if_t<std::is_same<CURRENT_ARGUMENT_TYPE, EncodedJSValue>::value>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, CellValue payload, Args... args)
    {
        unsigned numArgRegisters = GPRInfo::numberOfArgumentRegisters;
        unsigned currentArgCount = argSourceRegs.argCount(payload.gpr());
        unsigned alignedArgCount = roundUpToMultipleOf<2>(currentArgCount);

        if (alignedArgCount + 1 < numArgRegisters) {
            auto updatedArgSourceRegs = argSourceRegs.pushRegArg(payload.gpr(), GPRInfo::toArgumentRegister(alignedArgCount));

            if (alignedArgCount > currentArgCount)
                setupArgumentsImpl<OperationType>(updatedArgSourceRegs.addGPRExtraArg().addGPRExtraArg(), args...);
            else
                setupArgumentsImpl<OperationType>(updatedArgSourceRegs.addGPRExtraArg(), args...);

            move(TrustedImm32(JSValue::CellTag), GPRInfo::toArgumentRegister(alignedArgCount + 1));

        } else
            pokeArgumentsAligned<OperationType>(argSourceRegs, payload.gpr(), TrustedImm32(JSValue::CellTag), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    std::enable_if_t<std::is_same<CURRENT_ARGUMENT_TYPE, EncodedJSValue>::value>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, JSValueRegs arg, Args... args)
    {
        unsigned numArgRegisters = GPRInfo::numberOfArgumentRegisters;
        unsigned currentArgCount = argSourceRegs.argCount(arg.tagGPR());
        unsigned alignedArgCount = roundUpToMultipleOf<2>(currentArgCount);

        if (alignedArgCount + 1 < numArgRegisters) {
            // JSValueRegs is passed in two 32-bit registers on these architectures. Increase both numGPRArgs and extraGPRArgs by 1.
            // We can't just add 2 to numGPRArgs, since it is used for CURRENT_ARGUMENT_TYPE. Adding 2 would lead to a skipped argument.
            auto updatedArgSourceRegs1 = argSourceRegs.pushRegArg(arg.payloadGPR(), GPRInfo::toArgumentRegister(alignedArgCount));
            auto updatedArgSourceRegs2 = updatedArgSourceRegs1.pushExtraRegArg(arg.tagGPR(), GPRInfo::toArgumentRegister(alignedArgCount + 1));

            if (alignedArgCount > currentArgCount)
                setupArgumentsImpl<OperationType>(updatedArgSourceRegs2.addGPRExtraArg(), args...);
            else
                setupArgumentsImpl<OperationType>(updatedArgSourceRegs2, args...);
        } else
            pokeArgumentsAligned<OperationType>(argSourceRegs, arg.payloadGPR(), arg.tagGPR(), args...);
    }

#endif // CPU(ARM_THUMB2)
#endif // USE(JSVALUE64)

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename Arg, typename... Args>
    ALWAYS_INLINE std::enable_if_t<
        std::is_base_of<TrustedImm, Arg>::value
        || std::is_convertible<Arg, TrustedImm>::value> // We have this since DFGSpeculativeJIT has it's own implementation of TrustedImmPtr
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg arg, Args... args)
    {
        // Right now this only supports non-floating point immediate arguments since we never call operations with non-register values.
        // If we ever needed to support immediate floating point arguments we would need to duplicate this logic for both types, which sounds
        // gross so it's probably better to do that marshalling before the call operation...
        static_assert(!std::is_floating_point<CURRENT_ARGUMENT_TYPE>::value, "We don't support immediate floats/doubles in setupArguments");
        auto numArgRegisters = GPRInfo::numberOfArgumentRegisters;
        auto currentArgCount = numGPRArgs + extraGPRArgs;
        if (currentArgCount < numArgRegisters) {
            setupArgumentsImpl<OperationType>(argSourceRegs.addGPRArg(), args...);
            move(arg, GPRInfo::toArgumentRegister(currentArgCount));
            return;
        }

        pokeForArgument(arg, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
        setupArgumentsImpl<OperationType>(argSourceRegs.addGPRArg(), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename Arg, typename... Args>
    ALWAYS_INLINE std::enable_if_t<
        std::is_same<CURRENT_ARGUMENT_TYPE, Arg>::value
        && std::is_integral<CURRENT_ARGUMENT_TYPE>::value
        && (sizeof(CURRENT_ARGUMENT_TYPE) <= 4)>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg arg, Args... args)
    {
        setupArgumentsImpl<OperationType>(argSourceRegs, TrustedImm32(arg), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename Arg, typename... Args>
    ALWAYS_INLINE std::enable_if_t<
        std::is_same<CURRENT_ARGUMENT_TYPE, Arg>::value
        && std::is_integral<CURRENT_ARGUMENT_TYPE>::value
        && (sizeof(CURRENT_ARGUMENT_TYPE) == 8)>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg arg, Args... args)
    {
        setupArgumentsImpl<OperationType>(argSourceRegs, TrustedImm64(arg), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename Arg, typename... Args>
    ALWAYS_INLINE std::enable_if_t<
        std::is_pointer<CURRENT_ARGUMENT_TYPE>::value
        && std::is_same<Arg, std::nullptr_t>::value>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg arg, Args... args)
    {
        setupArgumentsImpl<OperationType>(argSourceRegs, TrustedImmPtr(arg), args...);
    }

    // Special case DFG::RegisteredStructure because it's really annoying to deal with otherwise...
    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename Arg, typename... Args>
    ALWAYS_INLINE std::enable_if_t<
        std::is_same<CURRENT_ARGUMENT_TYPE, Structure*>::value
        && std::is_same<Arg, DFG::RegisteredStructure>::value>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg arg, Args... args)
    {
        setupArgumentsImpl<OperationType>(argSourceRegs, TrustedImmPtr(arg.get()), args...);
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename Arg, typename... Args>
    ALWAYS_INLINE std::enable_if_t<std::is_base_of_v<ConstantMaterializer, Arg>>
    setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Arg arg, Args... args)
    {
        static_assert(!std::is_floating_point<CURRENT_ARGUMENT_TYPE>::value, "We don't support immediate floats/doubles in setupArguments");
        auto numArgRegisters = GPRInfo::numberOfArgumentRegisters;
        auto currentArgCount = numGPRArgs + extraGPRArgs;
        if (currentArgCount < numArgRegisters) {
            setupArgumentsImpl<OperationType>(argSourceRegs.addGPRArg(), args...);
            arg.materialize(*this, GPRInfo::toArgumentRegister(currentArgCount));
            return;
        }


        pokeForArgument(arg, numGPRArgs, numFPRArgs, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke);
        setupArgumentsImpl<OperationType>(argSourceRegs.addGPRArg(), args...);
    }

    template<typename OperationType, unsigned gprIndex>
    constexpr void finalizeGPRArguments(std::index_sequence<>)
    {
    }

    template<typename OperationType, unsigned gprIndex, size_t arityIndex, size_t... remainingArityIndices>
    constexpr void finalizeGPRArguments(std::index_sequence<arityIndex, remainingArityIndices...>)
    {
        using NextIndexSequenceType = std::index_sequence<remainingArityIndices...>;
        using ArgumentType = typename FunctionTraits<OperationType>::template ArgumentType<arityIndex>;

        // Every non-double-typed argument should be passed in through GPRRegs, and inversely only double-typed
        // arguments should be passed through FPRRegs. This is asserted in the invocation of the lastly-called
        // setupArgumentsImpl(ArgCollection<>) overload, by matching the number of handled GPR and FPR arguments
        // with the corresponding count of properly-typed arguments for this operation.
        if (!std::is_same_v<ArgumentType, double>) {
            // RV64 calling convention requires all 32-bit values to be sign-extended into the whole register.
            // JSC JIT is tailored for other ISAs that pass these values in 32-bit-wide registers, which RISC-V
            // doesn't support, so any 32-bit value passed in argument registers has to be manually sign-extended.
            if (isRISCV64() && gprIndex < GPRInfo::numberOfArgumentRegisters
                && std::is_integral_v<ArgumentType> && sizeof(ArgumentType) == 4) {
                GPRReg argReg = GPRInfo::toArgumentRegister(gprIndex);
                signExtend32ToPtr(argReg, argReg);
            }

            finalizeGPRArguments<OperationType, gprIndex + 1>(NextIndexSequenceType());
        } else
            finalizeGPRArguments<OperationType, gprIndex>(NextIndexSequenceType());
    }

    template<typename ArgType> using GPRArgCountValue = std::conditional_t<std::is_same_v<ArgType, double>,
        std::integral_constant<unsigned, 0>, std::integral_constant<unsigned, 1>>;
    template<typename ArgType> using FPRArgCountValue = std::conditional_t<std::is_same_v<ArgType, double>,
        std::integral_constant<unsigned, 1>, std::integral_constant<unsigned, 0>>;

    template<typename OperationTraitsType, size_t... argIndices>
    static constexpr unsigned gprArgsCount(std::index_sequence<argIndices...>)
    {
        return (0 + ... + (GPRArgCountValue<typename OperationTraitsType::template ArgumentType<argIndices>>::value));
    }

    template<typename OperationTraitsType, size_t... argIndices>
    static constexpr unsigned fprArgsCount(std::index_sequence<argIndices...>)
    {
        return (0 + ... + (FPRArgCountValue<typename OperationTraitsType::template ArgumentType<argIndices>>::value));
    }

    // Base case; set up the argument registers.
    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke>
    ALWAYS_INLINE void setupArgumentsImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs)
    {
        using TraitsType = FunctionTraits<OperationType>;
        static_assert(TraitsType::arity == numGPRArgs + numFPRArgs, "One last sanity check");
#if USE(JSVALUE64)
        static_assert(TraitsType::cCallArity() == numGPRArgs + numFPRArgs + extraPoke, "Check the CCall arity");
#endif
        static_assert(gprArgsCount<TraitsType>(std::make_index_sequence<TraitsType::arity>()) == numGPRArgs);
        static_assert(fprArgsCount<TraitsType>(std::make_index_sequence<TraitsType::arity>()) == numFPRArgs);

        shuffleRegisters<GPRReg, numGPRSources>(clampArrayToSize<numGPRSources, GPRReg>(argSourceRegs.gprSources), clampArrayToSize<numGPRSources, GPRReg>(argSourceRegs.gprDestinations));
        static_assert(!numCrossSources, "shouldn't be used on this architecture.");

        shuffleRegisters<FPRReg, numFPRSources>(clampArrayToSize<numFPRSources, FPRReg>(argSourceRegs.fprSources), clampArrayToSize<numFPRSources, FPRReg>(argSourceRegs.fprDestinations));
    }

    template<typename OperationType, unsigned numGPRArgs, unsigned numGPRSources, unsigned numFPRArgs, unsigned numFPRSources, unsigned numCrossSources, unsigned extraGPRArgs, unsigned nonArgGPRs, unsigned extraPoke, typename... Args>
    ALWAYS_INLINE void setupArgumentsEntryImpl(ArgCollection<numGPRArgs, numGPRSources, numFPRArgs, numFPRSources, numCrossSources, extraGPRArgs, nonArgGPRs, extraPoke> argSourceRegs, Args... args)
    {
        using FirstArgumentType = typename FunctionTraits<OperationType>::template ArgumentType<0>;
        if constexpr (std::is_same<FirstArgumentType, CallFrame*>::value) {
#if USE(JSVALUE64)
            // This only really works for 64-bit since jsvalue regs mess things up for 32-bit...
            static_assert(FunctionTraits<OperationType>::cCallArity() == sizeof...(Args) + 1, "Basic sanity check");
#endif
            setupArgumentsImpl<OperationType>(argSourceRegs, GPRInfo::callFrameRegister, args...);
        } else {
#if USE(JSVALUE64)
            // This only really works for 64-bit since jsvalue regs mess things up for 32-bit...
            static_assert(FunctionTraits<OperationType>::cCallArity() == sizeof...(Args), "Basic sanity check");
#endif
            setupArgumentsImpl<OperationType>(argSourceRegs, args...);
        }

        finalizeGPRArguments<OperationType, 0>(std::make_index_sequence<FunctionTraits<OperationType>::arity>());
    }

#undef CURRENT_ARGUMENT_TYPE
#undef RESULT_TYPE

public:

    template<typename OperationType, typename... Args>
    ALWAYS_INLINE void setupArguments(Args... args)
    {
        setupArgumentsEntryImpl<OperationType>(ArgCollection<0, 0, 0, 0, 0, 0, 0, 0>(), args...);
    }

    template<typename OperationType, typename... Args>
    ALWAYS_INLINE void setupArgumentsForIndirectCall(GPRReg functionGPR, Args... args)
    {
        setupArgumentsEntryImpl<OperationType>(ArgCollection<0, 0, 0, 0, 0, 0, 0, 0>().pushNonArg(functionGPR, GPRInfo::nonArgGPR0), args...);
    }

    template<typename OperationType, typename... Args>
    ALWAYS_INLINE void setupArgumentsForIndirectCall(Address address, Args... args)
    {
        setupArgumentsEntryImpl<OperationType>(ArgCollection<0, 0, 0, 0, 0, 0, 0, 0>().pushNonArg(address.base, GPRInfo::nonArgGPR0), args...);
    }

    void setupResults(GPRReg destA, GPRReg destB = InvalidGPRReg)
    {
        GPRReg srcA = GPRInfo::returnValueGPR;
        GPRReg srcB = GPRInfo::returnValueGPR2;

        if (destA == InvalidGPRReg)
            move(srcB, destB);
        else if (destB == InvalidGPRReg)
            move(srcA, destA);
        else if (srcB != destA) {
            // Handle the easy cases - two simple moves.
            move(srcA, destA);
            move(srcB, destB);
        } else if (srcA != destB) {
            // Handle the non-swap case - just put srcB in place first.
            move(srcB, destB);
            move(srcA, destA);
        } else
            swap(destA, destB);
    }
    
    void setupResults(JSValueRegs regs)
    {
#if USE(JSVALUE64)
        move(GPRInfo::returnValueGPR, regs.gpr());
#else
        setupResults(regs.payloadGPR(), regs.tagGPR());
#endif
    }
    
    void setupResults(FPRReg destA)
    {
        if (destA != InvalidFPRReg)
            moveDouble(FPRInfo::returnValueFPR, destA);
    }

    void jumpToExceptionHandler(VM& vm)
    {
        // genericUnwind() leaves the handler CallFrame* in vm->callFrameForCatch,
        // and the address of the handler in vm->targetMachinePCForThrow.
        loadPtr(&vm.targetMachinePCForThrow, GPRInfo::regT1);
        farJump(GPRInfo::regT1, ExceptionHandlerPtrTag);
    }

#if USE(JSVALUE64)
    template<typename T>
    requires (isExceptionOperationResult<T>)
    static constexpr GPRReg operationExceptionRegister()
    {
        static_assert(assertNotOperationSignature<T>);
        if (std::is_floating_point_v<typename T::ResultType> || std::is_same_v<typename T::ResultType, void>)
            return GPRInfo::returnValueGPR;
        return GPRInfo::returnValueGPR2;
    }
#else
    template<typename T>
    requires (isExceptionOperationResult<T>)
    static constexpr GPRReg operationExceptionRegister()
    {
        static_assert(assertNotOperationSignature<T>);
        if (std::is_same_v<T, ExceptionOperationResult<void>>)
            return GPRInfo::returnValueGPR;
        return GPRInfo::returnValueGPR2;
    }
#endif

    template<typename T>
    requires (!isExceptionOperationResult<T>)
    static constexpr GPRReg operationExceptionRegister()
    {
        static_assert(assertNotOperationSignature<T>);
        return InvalidGPRReg;
    }

    template<auto operation>
    static constexpr GPRReg operationExceptionRegister() { return operationExceptionRegister<OperationReturnType<typename FunctionTraits<decltype(operation)>::ResultType>>(); }

    void prepareForTailCallSlow(RegisterSet preserved = { })
    {
        GPRReg temp1 = selectScratchGPR(preserved);
        preserved.add(temp1, IgnoreVectors);
        GPRReg temp2 = selectScratchGPR(preserved);
        preserved.add(temp2, IgnoreVectors);
#if CPU(ARM64E)
        GPRReg temp3 = selectScratchGPR(preserved);
        preserved.add(temp3, IgnoreVectors);
#endif
        ASSERT(!preserved.numberOfSetFPRs());

        GPRReg newFramePointer = temp1;
        GPRReg newFrameSizeGPR = temp2;
        {
            // The old frame size is its number of arguments (or number of
            // parameters in case of arity fixup), plus the frame header size,
            // aligned
            GPRReg oldFrameSizeGPR = temp2;
            {
                GPRReg argCountGPR = oldFrameSizeGPR;
                load32(Address(framePointerRegister, CallFrameSlot::argumentCountIncludingThis * static_cast<int>(sizeof(Register)) + PayloadOffset), argCountGPR);

                {
                    GPRReg numParametersGPR = temp1;
                    {
                        GPRReg codeBlockGPR = numParametersGPR;
                        loadPtr(Address(framePointerRegister, CallFrameSlot::codeBlock * static_cast<int>(sizeof(Register))), codeBlockGPR);
                        load32(Address(codeBlockGPR, CodeBlock::offsetOfNumParameters()), numParametersGPR);
                    }

                    ASSERT(numParametersGPR != argCountGPR);
                    Jump argumentCountWasNotFixedUp = branch32(BelowOrEqual, numParametersGPR, argCountGPR);
                    move(numParametersGPR, argCountGPR);
                    argumentCountWasNotFixedUp.link(this);
                }

                add32(TrustedImm32(stackAlignmentRegisters() + CallFrame::headerSizeInRegisters - 1), argCountGPR, oldFrameSizeGPR);
                and32(TrustedImm32(-stackAlignmentRegisters()), oldFrameSizeGPR);
                // We assume < 2^28 arguments
                mul32(TrustedImm32(sizeof(Register)), oldFrameSizeGPR, oldFrameSizeGPR);
            }

            // The new frame pointer is at framePointer + oldFrameSize - newFrameSize
            ASSERT(newFramePointer != oldFrameSizeGPR);
            addPtr(framePointerRegister, oldFrameSizeGPR, newFramePointer);

            // The new frame size is just the number of arguments plus the
            // frame header size, aligned
            ASSERT(newFrameSizeGPR != newFramePointer);
            load32(Address(stackPointerRegister, CallFrameSlot::argumentCountIncludingThis * static_cast<int>(sizeof(Register)) + PayloadOffset - sizeof(CallerFrameAndPC)),
                newFrameSizeGPR);
            add32(TrustedImm32(stackAlignmentRegisters() + CallFrame::headerSizeInRegisters - 1), newFrameSizeGPR);
            and32(TrustedImm32(-stackAlignmentRegisters()), newFrameSizeGPR);
            // We assume < 2^28 arguments
            mul32(TrustedImm32(sizeof(Register)), newFrameSizeGPR, newFrameSizeGPR);
        }

        // We don't need the current frame beyond this point. Masquerade as our
        // caller.
#if CPU(ARM_THUMB2) || CPU(ARM64) || CPU(RISCV64)
        loadPtr(Address(framePointerRegister, CallFrame::returnPCOffset()), linkRegister);
        subPtr(TrustedImm32(2 * sizeof(void*)), newFrameSizeGPR);
#if CPU(ARM64E)
        GPRReg tempGPR = temp3;
        ASSERT(tempGPR != newFramePointer && tempGPR != newFrameSizeGPR);
        addPtr(TrustedImm32(sizeof(CallerFrameAndPC)), MacroAssembler::framePointerRegister, tempGPR);
        untagPtr(tempGPR, linkRegister);
        validateUntaggedPtr(linkRegister, tempGPR);
#endif
#elif CPU(X86_64)
        push(Address(framePointerRegister, sizeof(void*)));
        subPtr(TrustedImm32(sizeof(void*)), newFrameSizeGPR);
#else
        UNREACHABLE_FOR_PLATFORM();
#endif
        subPtr(newFrameSizeGPR, newFramePointer);
        loadPtr(Address(framePointerRegister), framePointerRegister);

        // We need to move the newFrameSizeGPR slots above the stack pointer by
        // newFramePointer registers. We use pointer-sized chunks.
        MacroAssembler::Label copyLoop(label());

        subPtr(TrustedImm32(sizeof(void*)), newFrameSizeGPR);
        transferPtr(BaseIndex(stackPointerRegister, newFrameSizeGPR, TimesOne), BaseIndex(newFramePointer, newFrameSizeGPR, TimesOne));
        branchTest32(MacroAssembler::NonZero, newFrameSizeGPR).linkTo(copyLoop, this);

        // Ready for a jump!
        move(newFramePointer, stackPointerRegister);
    }

    static Address addressOfCalleeCalleeFromCallerPerspective(int offset)
    {
        CCallHelpers::Address calleeFrame = CCallHelpers::Address(MacroAssembler::stackPointerRegister, 0);
        return calleeFrame.withOffset(CallFrameSlot::callee * static_cast<int>(sizeof(Register)))
            // calleeFrame is from the caller's perspective
            .withOffset(-safeCast<int>(sizeof(CallerFrameAndPC)))
            .withOffset(PayloadOffset)
            .withOffset(offset);
    }

    // This function is used to store the wasm callee in case this function hasn't tiered up yet.
    // The LLInt/IPInt is going to expect this so that the common entrypoint can read bytecode/metadata.
    void storeWasmCalleeCallee(RegisterID value, int offset = 0)
    {
        JIT_COMMENT(*this, "< Store Callee's wasm callee");
        auto addr = CCallHelpers::addressOfCalleeCalleeFromCallerPerspective(offset);
#if USE(JSVALUE64)
        storePtr(value, addr);
#elif USE(JSVALUE32_64)
        store32(value, addr.withOffset(PayloadOffset));
        store32(TrustedImm32(JSValue::NativeCalleeTag), addr.withOffset(TagOffset));
#else
#error "Unsupported configuration"
#endif
    }

    void storeWasmCalleeCallee(const uintptr_t* boxedWasmCalleeLoadLocation)
    {
        ASSERT(boxedWasmCalleeLoadLocation);
        JIT_COMMENT(*this, "> ", RawHex(*boxedWasmCalleeLoadLocation));
        move(TrustedImmPtr(*boxedWasmCalleeLoadLocation), scratchRegister());
        storeWasmCalleeCallee(scratchRegister());
    }

    DataLabelPtr storeWasmCalleeCalleePatchable(int offset = 0)
    {
        JIT_COMMENT(*this, "Store Callee's wasm callee (patchable)");
        auto patch = moveWithPatch(TrustedImmPtr(nullptr), scratchRegister());
        auto addr = CCallHelpers::addressOfCalleeCalleeFromCallerPerspective(offset);
#if USE(JSVALUE64)
        storePtr(scratchRegister(), addr);
#elif USE(JSVALUE32_64)
        store32(scratchRegister(), addr.withOffset(PayloadOffset));
        store32(TrustedImm32(JSValue::NativeCalleeTag), addr.withOffset(TagOffset));
#else
#error "Unsupported configuration"
#endif
        return patch;
    }
    
    // These operations clobber all volatile registers. They assume that there is room on the top of
    // stack to marshall call arguments.
    void logShadowChickenProloguePacket(GPRReg shadowPacket, GPRReg scratch1, GPRReg scope);

private:
    template <typename CodeBlockType>
    void logShadowChickenTailPacketImpl(GPRReg shadowPacket, JSValueRegs thisRegs, GPRReg scope, CodeBlockType codeBlock, CallSiteIndex callSiteIndex);
public:
    void logShadowChickenTailPacket(GPRReg shadowPacket, JSValueRegs thisRegs, GPRReg scope, GPRReg codeBlock, CallSiteIndex callSiteIndex);

    // Leaves behind a pointer to the Packet we should write to in shadowPacket.
    void ensureShadowChickenPacket(VM&, GPRReg shadowPacket, GPRReg scratch1NonArgGPR, GPRReg scratch2);

    void emitCTIThunkPrologue(bool returnAddressAlreadyTagged = false);
    void emitCTIThunkEpilogue();
};

} // namespace JSC

#endif // ENABLE(JIT)
