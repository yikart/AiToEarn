/*
 * Copyright (C) 2019 Metrological Group B.V.
 * Copyright (C) 2019 Igalia S.L.
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

#include <wtf/Assertions.h>

/* This file serves as the platform independent redirection header for
 * platform dependent register information. Each architecture has its own header.
 *
 * Each header defines a few important macros that are used in a platform independent
 * way - see for example jit/RegisterSet.cpp.
 * - FOR_EACH_GP_REGISTER which lists all available general purpose registers.
 * - FOR_EACH_FP_REGISTER which lists all available floating point registers.
 * these take themselves a macro that can filter through the available information
 * spread accross the four macro arguments.
 * = 1. id: is an identifier used to specify the register (for example, as an enumerator
 * in an enum);
 * = 2. name: is a string constant specifying the name of the identifier;
 * = 3. isReserved: a boolean (usually 0/1) specifying if this is a reserved register;
 * = 4. isCalleeSaved: a boolean (usually 0/1) specifying if this is a callee saved register;
 *
 * - A few other platform dependent macros can be specified to be used in platform
 *   dependent files (for example assembler X86Assembler.h).
 */

#if CPU(X86_64)
#include "X86_64Registers.h"
#elif CPU(ARM_THUMB2)
#include "ARMv7Registers.h"
#elif CPU(ARM64)
#include "ARM64Registers.h"
#else
    UNREACHABLE_FOR_PLATFORM();
#endif
