/*
 * Copyright (C) 2011 Google Inc.  All rights reserved.
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

#include <cstdint>
#include <wtf/OptionSet.h>

// GCGL types match the corresponding GL types as defined in OpenGL ES 2.0
// header file gl2.h from khronos.org.
typedef unsigned GCGLenum;
typedef unsigned char GCGLboolean;
typedef unsigned GCGLbitfield;
typedef signed char GCGLbyte;
typedef unsigned char GCGLubyte;
typedef short GCGLshort;
typedef unsigned short GCGLushort;
typedef int GCGLint;
typedef int GCGLsizei;
typedef unsigned GCGLuint;
typedef float GCGLfloat;
typedef unsigned short GCGLhalffloat;
typedef float GCGLclampf;
typedef char GCGLchar;
typedef void* GCGLsync;
typedef void GCGLvoid;

// These GCGL types do not strictly match the GL types as defined in OpenGL ES 2.0
// header file for all platforms.
typedef intptr_t GCGLintptr;
typedef intptr_t GCGLsizeiptr;
typedef intptr_t GCGLvoidptr;
typedef int64_t GCGLint64;
typedef uint64_t GCGLuint64;

typedef GCGLuint PlatformGLObject;

// GCGL types match the corresponding EGL types as defined in Khronos Native
// Platform Graphics Interface - EGL Version 1.5 header file egl.h from
// khronos.org.

// FIXME: These should be renamed to GCEGLxxx
using GCGLDisplay = void*;
using GCGLConfig = void*;
using GCGLContext = void*;
using GCEGLSurface = void*;
using GCGLExternalImage = unsigned;
using GCGLExternalSync = unsigned;

#if !PLATFORM(COCOA)
typedef unsigned GLuint;
#endif

#if ENABLE(WEBXR)
// GL_ANGLE_variable_rasterization_rate_metal
using GCGLMTLRasterizationRateMapANGLE = void*;
#endif

// Order in inverse of in GL specification, so that iteration is in GL specification order.
enum class GCGLErrorCode : uint8_t {
    ContextLost = 1,
    InvalidFramebufferOperation = 1 << 2,
    OutOfMemory = 1 << 3,
    InvalidOperation = 1 << 4,
    InvalidValue = 1 << 5,
    InvalidEnum = 1 << 6
};
using GCGLErrorCodeSet = OptionSet<GCGLErrorCode>;
