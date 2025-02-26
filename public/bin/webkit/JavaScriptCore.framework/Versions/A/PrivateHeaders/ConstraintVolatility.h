/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#pragma once

#include <wtf/PrintStream.h>

namespace JSC {

enum class ConstraintVolatility : uint8_t {
    // The constraint needs to be validated, but it is unlikely to ever produce information.
    // It's best to run it at the bitter end.
    SeldomGreyed,
    
    // FIXME: We could introduce a new kind of volatility called GreyedByResumption, which
    // would mean running all of the times that GreyedByExecution runs except as a root in a
    // full GC.
    // https://bugs.webkit.org/show_bug.cgi?id=166830
    
    // The constraint needs to be reevaluated anytime the mutator runs: so at GC start and
    // whenever the GC resuspends after a resumption. This is almost always something that
    // you'd call a "root" in a traditional GC.
    GreyedByExecution,
    
    // The constraint needs to be reevaluated any time any object is marked and anytime the
    // mutator resumes.
    GreyedByMarking
};
    
} // namespace JSC

namespace WTF {

inline void printInternal(PrintStream& out, JSC::ConstraintVolatility volatility)
{
    switch (volatility) {
    case JSC::ConstraintVolatility::SeldomGreyed:
        out.print("SeldomGreyed");
        return;
    case JSC::ConstraintVolatility::GreyedByExecution:
        out.print("GreyedByExecuction");
        return;
    case JSC::ConstraintVolatility::GreyedByMarking:
        out.print("GreyedByMarking");
        return;
    }
    RELEASE_ASSERT_NOT_REACHED();
}

} // namespace WTF

