/*
 * Copyright (C) 2008-2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(C_LOOP)

#include "Register.h"
#include <wtf/Noncopyable.h>
#include <wtf/PageReservation.h>

namespace JSC {

    class CodeBlockSet;
    class ConservativeRoots;
    class JITStubRoutineSet;
    class VM;
    class LLIntOffsetsExtractor;

    class CLoopStack {
        WTF_MAKE_NONCOPYABLE(CLoopStack);
    public:
        // Allow 8k of excess registers before we start trying to reap the stack
        static constexpr ptrdiff_t maxExcessCapacity = 8 * 1024;

        CLoopStack(VM&);
        ~CLoopStack();
        
        bool ensureCapacityFor(Register* newTopOfStack);

        bool containsAddress(Register* address) { return (lowAddress() <= address && address < highAddress()); }
        static size_t committedByteCount();

        void gatherConservativeRoots(ConservativeRoots&, JITStubRoutineSet&, CodeBlockSet&);
        void sanitizeStack();

        inline void* currentStackPointer() const;
        void setCurrentStackPointer(void* sp) { m_currentStackPointer = sp; }

        size_t size() const { return highAddress() - lowAddress(); }

        void setSoftReservedZoneSize(size_t);
        bool isSafeToRecurse() const;

    private:
        Register* lowAddress() const
        {
            return m_end;
        }

        WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

        Register* highAddress() const
        {
            return reinterpret_cast_ptr<Register*>(static_cast<char*>(m_reservation.base()) + m_reservation.size());
        }

        WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

        Register* reservationTop() const
        {
            char* reservationTop = static_cast<char*>(m_reservation.base());
            return reinterpret_cast_ptr<Register*>(reservationTop);
        }

        bool grow(Register* newTopOfStack);
        void releaseExcessCapacity();
        void addToCommittedByteCount(long);

        void setCLoopStackLimit(Register* newTopOfStack);

        VM& m_vm;
        CallFrame*& m_topCallFrame;

        // The following is always true:
        //    reservationTop() <= m_commitTop <= m_end <= m_currentStackPointer <= highAddress()
        Register* m_end; // lowest address of JS allocatable stack memory.
        Register* m_commitTop; // lowest address of committed memory.
        PageReservation m_reservation;
        void* m_lastStackPointer;
        void* m_currentStackPointer;
        ptrdiff_t m_softReservedZoneSizeInRegisters;

        friend class LLIntOffsetsExtractor;
    };

} // namespace JSC

#endif // ENABLE(C_LOOP)
