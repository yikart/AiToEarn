/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include <wtf/Vector.h>

#define CONTENT_EXTENSIONS_STATE_MACHINE_DEBUGGING 0

#define CONTENT_EXTENSIONS_PERFORMANCE_REPORTING 0

#if CONTENT_EXTENSIONS_STATE_MACHINE_DEBUGGING
typedef CrashOnOverflow ContentExtensionsOverflowHandler;
#else
typedef UnsafeVectorOverflow ContentExtensionsOverflowHandler;
#endif

#if CONTENT_EXTENSIONS_PERFORMANCE_REPORTING
#define LOG_LARGE_STRUCTURES(name, size) if (size > 1000000) { dataLogF("NAME: %s SIZE %d\n", #name, (int)(size)); };
#else
#define LOG_LARGE_STRUCTURES(name, size)
#endif

#endif // ENABLE(CONTENT_EXTENSIONS)
