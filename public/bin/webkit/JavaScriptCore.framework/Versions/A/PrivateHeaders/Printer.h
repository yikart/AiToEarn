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

#include "CPU.h"

#include <wtf/PrintStream.h>
#include <wtf/StringPrintStream.h>
#include <wtf/Vector.h>

namespace JSC {

namespace Probe {
class Context;
} // namespace Probe

namespace Printer {

struct Context;

union Data {
    Data()
    {
        const intptr_t uninitialized = 0xdeadb0d0;
        memcpy(&buffer, &uninitialized, sizeof(uninitialized));
    }
    Data(uintptr_t value)
        : Data(&value, sizeof(value))
    { }
    Data(const void* pointer)
        : Data(&pointer, sizeof(pointer))
    { }
    Data(void* src, size_t size)
    {
        RELEASE_ASSERT(size <= sizeof(buffer));
        memcpy(&buffer, src, size);
    }

    template<typename T, typename = typename std::enable_if<std::is_integral<T>::value>::type>
    T as() const
    {
        return static_cast<T>(value);
    }

    template<typename T, typename = typename std::enable_if<std::is_pointer<T>::value>::type>
    const T as(int = 0) const
    {
        return reinterpret_cast<const T>(pointer);
    }

    template<typename T, typename = typename std::enable_if<!std::is_integral<T>::value && !std::is_pointer<T>::value>::type>
    const T& as() const
    {
        static_assert(sizeof(T) <= sizeof(buffer), "size is not sane");
        return *reinterpret_cast<const T*>(&buffer);
    }

    uintptr_t value;
    const void* pointer;
#if USE(JSVALUE64)
    UCPURegister buffer[4];
#elif USE(JSVALUE32_64)
    UCPURegister buffer[6];
#endif
};

struct Context {
    Context(Probe::Context& probeContext, Data& data)
        : probeContext(probeContext)
        , data(data)
    { }

    Probe::Context& probeContext;
    Data& data;
};

typedef void (*Callback)(PrintStream&, Context&);

struct PrintRecord {
    PrintRecord(Data data, Callback printer)
        : data(data)
        , printer(printer)
    { }

    PrintRecord(Callback printer)
        : printer(printer)
    { }

    template<template<class> class Printer, typename T>
    PrintRecord(const Printer<T>& other)
    {
        static_assert(std::is_base_of<PrintRecord, Printer<T>>::value, "Printer should extend PrintRecord");
        static_assert(sizeof(PrintRecord) == sizeof(Printer<T>), "Printer should be the same size as PrintRecord");
        data = other.data;
        printer = other.printer;
    }

    Data data;
    Callback printer;

protected:
    PrintRecord() { }
};

template<typename T> struct Printer;

typedef Vector<PrintRecord> PrintRecordList;

inline void appendPrinter(PrintRecordList&) { }

template<typename First, typename... Arguments>
inline void appendPrinter(PrintRecordList& printRecordList, First first, Arguments&&... others)
{
    printRecordList.append(Printer<First>(first));
    appendPrinter(printRecordList, std::forward<Arguments>(others)...);
}

template<typename... Arguments>
inline PrintRecordList* makePrintRecordList(Arguments&&... arguments)
{
    // FIXME: the current implementation intentionally leaks the PrintRecordList.
    // We may want to fix this in the future if we want to use the print mechanism
    // in tests that may compile a lot of prints.
    // https://bugs.webkit.org/show_bug.cgi?id=171123
    auto printRecordList = new PrintRecordList();
    appendPrinter(*printRecordList, std::forward<Arguments>(arguments)...);
    return printRecordList;
}

// Some utility functions for specializing printers.

void printConstCharString(PrintStream&, Context&);
void printIntptr(PrintStream&, Context&);
void printUintptr(PrintStream&, Context&);
void printPointer(PrintStream&, Context&);

void setPrinter(PrintRecord&, CString&&);

// Specialized printers.

template<>
struct Printer<const char*> : public PrintRecord {
    Printer(const char* str)
        : PrintRecord(str, printConstCharString)
    { }
};

template<>
struct Printer<char*> : public Printer<const char*> {
    Printer(char* str)
        : Printer<const char*>(str)
    { }
};

template<>
struct Printer<RawPointer> : public PrintRecord {
    Printer(RawPointer rawPointer)
        : PrintRecord(rawPointer.value(), printPointer)
    { }
};

template<typename T>
std::enable_if_t<std::is_integral_v<T>>
setPrinter(PrintRecord& record, T value, intptr_t = 0)
{
    record.data.value = static_cast<uintptr_t>(value);
    if constexpr (std::numeric_limits<T>::is_signed)
        record.printer = printIntptr;
    else
        record.printer = printUintptr;
}

template<typename T>
struct Printer : public PrintRecord {
    Printer(T value)
    {
        setPrinter(*this, value);
    }
};

} // namespace Printer

} // namespace JSC
