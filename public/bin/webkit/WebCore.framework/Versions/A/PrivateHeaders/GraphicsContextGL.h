/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(WEBGL)

#include "DestinationColorSpace.h"
#include "GraphicsContextGLActiveInfo.h"
#include "GraphicsContextGLAttributes.h"
#include "GraphicsContextGLEnums.h"
#include "GraphicsLayerContentsDisplayDelegate.h"
#include "GraphicsTypesGL.h"
#include "Image.h"
#include "IntRect.h"
#include "IntSize.h"
#include <span>
#include <wtf/FunctionDispatcher.h>
#include <wtf/HashSet.h>
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

#if PLATFORM(COCOA)
#include <wtf/MachSendRight.h>
#endif

#if OS(WINDOWS)
// Defined in winerror.h
#ifdef NO_ERROR
#undef NO_ERROR
#endif
#endif

template<typename... Types>
struct GCGLSpanTuple;

namespace WebCore {
class ImageBuffer;
class PixelBuffer;

#if ENABLE(VIDEO) && USE(AVFOUNDATION)
class GraphicsContextGLCV;
#endif
#if ENABLE(VIDEO)
class MediaPlayer;
class VideoFrame;
#endif

class GraphicsContextGL;

#if PLATFORM(COCOA)
struct GraphicsContextGLExternalImageSourceIOSurfaceHandle {
    MachSendRight handle;
};
struct GraphicsContextGLExternalImageSourceMTLSharedTextureHandle {
    MachSendRight handle;
};
using GraphicsContextGLExternalImageSource = std::variant<
    GraphicsContextGLExternalImageSourceIOSurfaceHandle,
    GraphicsContextGLExternalImageSourceMTLSharedTextureHandle
    >;
using GraphicsContextGLExternalSyncSource = std::tuple<MachSendRight, uint64_t>;

#else

using GraphicsContextGLExternalImageSource = int;
using GraphicsContextGLExternalSyncSource = int;

#endif

enum class GraphicsContextGLSurfaceBuffer : bool {
    DrawingBuffer,
    DisplayBuffer
};

enum class GraphicsContextGLFlipY : bool { No, Yes };

// Base class for graphics context for implementing WebGL rendering model.
class GraphicsContextGL : public RefCounted<GraphicsContextGL> {
public:
    // WebGL 1 constants.
    static constexpr GCGLenum DEPTH_BUFFER_BIT = 0x00000100;
    static constexpr GCGLenum STENCIL_BUFFER_BIT = 0x00000400;
    static constexpr GCGLenum COLOR_BUFFER_BIT = 0x00004000;
    static constexpr GCGLenum POINTS = 0x0000;
    static constexpr GCGLenum LINES = 0x0001;
    static constexpr GCGLenum LINE_LOOP = 0x0002;
    static constexpr GCGLenum LINE_STRIP = 0x0003;
    static constexpr GCGLenum TRIANGLES = 0x0004;
    static constexpr GCGLenum TRIANGLE_STRIP = 0x0005;
    static constexpr GCGLenum TRIANGLE_FAN = 0x0006;
    static constexpr GCGLenum ZERO = 0;
    static constexpr GCGLenum ONE = 1;
    static constexpr GCGLenum SRC_COLOR = 0x0300;
    static constexpr GCGLenum ONE_MINUS_SRC_COLOR = 0x0301;
    static constexpr GCGLenum SRC_ALPHA = 0x0302;
    static constexpr GCGLenum ONE_MINUS_SRC_ALPHA = 0x0303;
    static constexpr GCGLenum DST_ALPHA = 0x0304;
    static constexpr GCGLenum ONE_MINUS_DST_ALPHA = 0x0305;
    static constexpr GCGLenum DST_COLOR = 0x0306;
    static constexpr GCGLenum ONE_MINUS_DST_COLOR = 0x0307;
    static constexpr GCGLenum SRC_ALPHA_SATURATE = 0x0308;
    static constexpr GCGLenum FUNC_ADD = 0x8006;
    static constexpr GCGLenum BLEND_EQUATION = 0x8009;
    static constexpr GCGLenum BLEND_EQUATION_RGB = 0x8009;
    static constexpr GCGLenum BLEND_EQUATION_ALPHA = 0x883D;
    static constexpr GCGLenum FUNC_SUBTRACT = 0x800A;
    static constexpr GCGLenum FUNC_REVERSE_SUBTRACT = 0x800B;
    static constexpr GCGLenum BLEND_DST_RGB = 0x80C8;
    static constexpr GCGLenum BLEND_SRC_RGB = 0x80C9;
    static constexpr GCGLenum BLEND_DST_ALPHA = 0x80CA;
    static constexpr GCGLenum BLEND_SRC_ALPHA = 0x80CB;
    static constexpr GCGLenum CONSTANT_COLOR = 0x8001;
    static constexpr GCGLenum ONE_MINUS_CONSTANT_COLOR = 0x8002;
    static constexpr GCGLenum CONSTANT_ALPHA = 0x8003;
    static constexpr GCGLenum ONE_MINUS_CONSTANT_ALPHA = 0x8004;
    static constexpr GCGLenum BLEND_COLOR = 0x8005;
    static constexpr GCGLenum ARRAY_BUFFER = 0x8892;
    static constexpr GCGLenum ELEMENT_ARRAY_BUFFER = 0x8893;
    static constexpr GCGLenum ARRAY_BUFFER_BINDING = 0x8894;
    static constexpr GCGLenum ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;
    static constexpr GCGLenum STREAM_DRAW = 0x88E0;
    static constexpr GCGLenum STATIC_DRAW = 0x88E4;
    static constexpr GCGLenum DYNAMIC_DRAW = 0x88E8;
    static constexpr GCGLenum BUFFER_SIZE = 0x8764;
    static constexpr GCGLenum BUFFER_USAGE = 0x8765;
    static constexpr GCGLenum CURRENT_VERTEX_ATTRIB = 0x8626;
    static constexpr GCGLenum FRONT = 0x0404;
    static constexpr GCGLenum BACK = 0x0405;
    static constexpr GCGLenum FRONT_AND_BACK = 0x0408;
    static constexpr GCGLenum TEXTURE_2D = 0x0DE1;
    static constexpr GCGLenum CULL_FACE = 0x0B44;
    static constexpr GCGLenum BLEND = 0x0BE2;
    static constexpr GCGLenum DITHER = 0x0BD0;
    static constexpr GCGLenum STENCIL_TEST = 0x0B90;
    static constexpr GCGLenum DEPTH_TEST = 0x0B71;
    static constexpr GCGLenum SCISSOR_TEST = 0x0C11;
    static constexpr GCGLenum POLYGON_OFFSET_FILL = 0x8037;
    static constexpr GCGLenum SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
    static constexpr GCGLenum SAMPLE_COVERAGE = 0x80A0;
    static constexpr GCGLenum NO_ERROR = 0;
    static constexpr GCGLenum INVALID_ENUM = 0x0500;
    static constexpr GCGLenum INVALID_VALUE = 0x0501;
    static constexpr GCGLenum INVALID_OPERATION = 0x0502;
    static constexpr GCGLenum OUT_OF_MEMORY = 0x0505;
    static constexpr GCGLenum CW = 0x0900;
    static constexpr GCGLenum CCW = 0x0901;
    static constexpr GCGLenum LINE_WIDTH = 0x0B21;
    static constexpr GCGLenum ALIASED_POINT_SIZE_RANGE = 0x846D;
    static constexpr GCGLenum ALIASED_LINE_WIDTH_RANGE = 0x846E;
    static constexpr GCGLenum CULL_FACE_MODE = 0x0B45;
    static constexpr GCGLenum FRONT_FACE = 0x0B46;
    static constexpr GCGLenum DEPTH_RANGE = 0x0B70;
    static constexpr GCGLenum DEPTH_WRITEMASK = 0x0B72;
    static constexpr GCGLenum DEPTH_CLEAR_VALUE = 0x0B73;
    static constexpr GCGLenum DEPTH_FUNC = 0x0B74;
    static constexpr GCGLenum STENCIL_CLEAR_VALUE = 0x0B91;
    static constexpr GCGLenum STENCIL_FUNC = 0x0B92;
    static constexpr GCGLenum STENCIL_FAIL = 0x0B94;
    static constexpr GCGLenum STENCIL_PASS_DEPTH_FAIL = 0x0B95;
    static constexpr GCGLenum STENCIL_PASS_DEPTH_PASS = 0x0B96;
    static constexpr GCGLenum STENCIL_REF = 0x0B97;
    static constexpr GCGLenum STENCIL_VALUE_MASK = 0x0B93;
    static constexpr GCGLenum STENCIL_WRITEMASK = 0x0B98;
    static constexpr GCGLenum STENCIL_BACK_FUNC = 0x8800;
    static constexpr GCGLenum STENCIL_BACK_FAIL = 0x8801;
    static constexpr GCGLenum STENCIL_BACK_PASS_DEPTH_FAIL = 0x8802;
    static constexpr GCGLenum STENCIL_BACK_PASS_DEPTH_PASS = 0x8803;
    static constexpr GCGLenum STENCIL_BACK_REF = 0x8CA3;
    static constexpr GCGLenum STENCIL_BACK_VALUE_MASK = 0x8CA4;
    static constexpr GCGLenum STENCIL_BACK_WRITEMASK = 0x8CA5;
    static constexpr GCGLenum VIEWPORT = 0x0BA2;
    static constexpr GCGLenum SCISSOR_BOX = 0x0C10;
    static constexpr GCGLenum COLOR_CLEAR_VALUE = 0x0C22;
    static constexpr GCGLenum COLOR_WRITEMASK = 0x0C23;
    static constexpr GCGLenum UNPACK_ALIGNMENT = 0x0CF5;
    static constexpr GCGLenum PACK_ALIGNMENT = 0x0D05;
    static constexpr GCGLenum MAX_TEXTURE_SIZE = 0x0D33;
    static constexpr GCGLenum MAX_VIEWPORT_DIMS = 0x0D3A;
    static constexpr GCGLenum SUBPIXEL_BITS = 0x0D50;
    static constexpr GCGLenum RED_BITS = 0x0D52;
    static constexpr GCGLenum GREEN_BITS = 0x0D53;
    static constexpr GCGLenum BLUE_BITS = 0x0D54;
    static constexpr GCGLenum ALPHA_BITS = 0x0D55;
    static constexpr GCGLenum DEPTH_BITS = 0x0D56;
    static constexpr GCGLenum STENCIL_BITS = 0x0D57;
    static constexpr GCGLenum POLYGON_OFFSET_UNITS = 0x2A00;
    static constexpr GCGLenum POLYGON_OFFSET_FACTOR = 0x8038;
    static constexpr GCGLenum TEXTURE_BINDING_2D = 0x8069;
    static constexpr GCGLenum SAMPLE_BUFFERS = 0x80A8;
    static constexpr GCGLenum SAMPLES = 0x80A9;
    static constexpr GCGLenum SAMPLE_COVERAGE_VALUE = 0x80AA;
    static constexpr GCGLenum SAMPLE_COVERAGE_INVERT = 0x80AB;
    static constexpr GCGLenum NUM_COMPRESSED_TEXTURE_FORMATS = 0x86A2;
    static constexpr GCGLenum COMPRESSED_TEXTURE_FORMATS = 0x86A3;
    static constexpr GCGLenum DONT_CARE = 0x1100;
    static constexpr GCGLenum FASTEST = 0x1101;
    static constexpr GCGLenum NICEST = 0x1102;
    static constexpr GCGLenum GENERATE_MIPMAP_HINT = 0x8192;
    static constexpr GCGLenum BYTE = 0x1400;
    static constexpr GCGLenum UNSIGNED_BYTE = 0x1401;
    static constexpr GCGLenum SHORT = 0x1402;
    static constexpr GCGLenum UNSIGNED_SHORT = 0x1403;
    static constexpr GCGLenum INT = 0x1404;
    static constexpr GCGLenum UNSIGNED_INT = 0x1405;
    static constexpr GCGLenum FLOAT = 0x1406;
    static constexpr GCGLenum HALF_FLOAT_OES = 0x8D61;
    static constexpr GCGLenum FIXED = 0x140C;
    static constexpr GCGLenum DEPTH_COMPONENT = 0x1902;
    static constexpr GCGLenum ALPHA = 0x1906;
    static constexpr GCGLenum RGB = 0x1907;
    static constexpr GCGLenum RGBA = 0x1908;
    static constexpr GCGLenum BGRA = 0x80E1;
    static constexpr GCGLenum LUMINANCE = 0x1909;
    static constexpr GCGLenum LUMINANCE_ALPHA = 0x190A;
    static constexpr GCGLenum UNSIGNED_SHORT_4_4_4_4 = 0x8033;
    static constexpr GCGLenum UNSIGNED_SHORT_5_5_5_1 = 0x8034;
    static constexpr GCGLenum UNSIGNED_SHORT_5_6_5 = 0x8363;
    static constexpr GCGLenum FRAGMENT_SHADER = 0x8B30;
    static constexpr GCGLenum VERTEX_SHADER = 0x8B31;
    static constexpr GCGLenum MAX_VERTEX_ATTRIBS = 0x8869;
    static constexpr GCGLenum MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
    static constexpr GCGLenum MAX_VARYING_VECTORS = 0x8DFC;
    static constexpr GCGLenum MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
    static constexpr GCGLenum MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
    static constexpr GCGLenum MAX_TEXTURE_IMAGE_UNITS = 0x8872;
    static constexpr GCGLenum MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
    static constexpr GCGLenum SHADER_TYPE = 0x8B4F;
    static constexpr GCGLenum DELETE_STATUS = 0x8B80;
    static constexpr GCGLenum LINK_STATUS = 0x8B82;
    static constexpr GCGLenum VALIDATE_STATUS = 0x8B83;
    static constexpr GCGLenum ATTACHED_SHADERS = 0x8B85;
    static constexpr GCGLenum ACTIVE_UNIFORMS = 0x8B86;
    static constexpr GCGLenum ACTIVE_UNIFORM_MAX_LENGTH = 0x8B87;
    static constexpr GCGLenum ACTIVE_ATTRIBUTES = 0x8B89;
    static constexpr GCGLenum ACTIVE_ATTRIBUTE_MAX_LENGTH = 0x8B8A;
    static constexpr GCGLenum SHADING_LANGUAGE_VERSION = 0x8B8C;
    static constexpr GCGLenum CURRENT_PROGRAM = 0x8B8D;
    static constexpr GCGLenum NEVER = 0x0200;
    static constexpr GCGLenum LESS = 0x0201;
    static constexpr GCGLenum EQUAL = 0x0202;
    static constexpr GCGLenum LEQUAL = 0x0203;
    static constexpr GCGLenum GREATER = 0x0204;
    static constexpr GCGLenum NOTEQUAL = 0x0205;
    static constexpr GCGLenum GEQUAL = 0x0206;
    static constexpr GCGLenum ALWAYS = 0x0207;
    static constexpr GCGLenum KEEP = 0x1E00;
    static constexpr GCGLenum REPLACE = 0x1E01;
    static constexpr GCGLenum INCR = 0x1E02;
    static constexpr GCGLenum DECR = 0x1E03;
    static constexpr GCGLenum INVERT = 0x150A;
    static constexpr GCGLenum INCR_WRAP = 0x8507;
    static constexpr GCGLenum DECR_WRAP = 0x8508;
    static constexpr GCGLenum VENDOR = 0x1F00;
    static constexpr GCGLenum RENDERER = 0x1F01;
    static constexpr GCGLenum VERSION = 0x1F02;
    static constexpr GCGLenum EXTENSIONS = 0x1F03;
    static constexpr GCGLenum NEAREST = 0x2600;
    static constexpr GCGLenum LINEAR = 0x2601;
    static constexpr GCGLenum NEAREST_MIPMAP_NEAREST = 0x2700;
    static constexpr GCGLenum LINEAR_MIPMAP_NEAREST = 0x2701;
    static constexpr GCGLenum NEAREST_MIPMAP_LINEAR = 0x2702;
    static constexpr GCGLenum LINEAR_MIPMAP_LINEAR = 0x2703;
    static constexpr GCGLenum TEXTURE_MAG_FILTER = 0x2800;
    static constexpr GCGLenum TEXTURE_MIN_FILTER = 0x2801;
    static constexpr GCGLenum TEXTURE_WRAP_S = 0x2802;
    static constexpr GCGLenum TEXTURE_WRAP_T = 0x2803;
    static constexpr GCGLenum TEXTURE = 0x1702;
    static constexpr GCGLenum TEXTURE_CUBE_MAP = 0x8513;
    static constexpr GCGLenum TEXTURE_BINDING_CUBE_MAP = 0x8514;
    static constexpr GCGLenum TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
    static constexpr GCGLenum TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
    static constexpr GCGLenum TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
    static constexpr GCGLenum TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
    static constexpr GCGLenum TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
    static constexpr GCGLenum TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A;
    static constexpr GCGLenum MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
    static constexpr GCGLenum TEXTURE0 = 0x84C0;
    static constexpr GCGLenum TEXTURE1 = 0x84C1;
    static constexpr GCGLenum TEXTURE2 = 0x84C2;
    static constexpr GCGLenum TEXTURE3 = 0x84C3;
    static constexpr GCGLenum TEXTURE4 = 0x84C4;
    static constexpr GCGLenum TEXTURE5 = 0x84C5;
    static constexpr GCGLenum TEXTURE6 = 0x84C6;
    static constexpr GCGLenum TEXTURE7 = 0x84C7;
    static constexpr GCGLenum TEXTURE8 = 0x84C8;
    static constexpr GCGLenum TEXTURE9 = 0x84C9;
    static constexpr GCGLenum TEXTURE10 = 0x84CA;
    static constexpr GCGLenum TEXTURE11 = 0x84CB;
    static constexpr GCGLenum TEXTURE12 = 0x84CC;
    static constexpr GCGLenum TEXTURE13 = 0x84CD;
    static constexpr GCGLenum TEXTURE14 = 0x84CE;
    static constexpr GCGLenum TEXTURE15 = 0x84CF;
    static constexpr GCGLenum TEXTURE16 = 0x84D0;
    static constexpr GCGLenum TEXTURE17 = 0x84D1;
    static constexpr GCGLenum TEXTURE18 = 0x84D2;
    static constexpr GCGLenum TEXTURE19 = 0x84D3;
    static constexpr GCGLenum TEXTURE20 = 0x84D4;
    static constexpr GCGLenum TEXTURE21 = 0x84D5;
    static constexpr GCGLenum TEXTURE22 = 0x84D6;
    static constexpr GCGLenum TEXTURE23 = 0x84D7;
    static constexpr GCGLenum TEXTURE24 = 0x84D8;
    static constexpr GCGLenum TEXTURE25 = 0x84D9;
    static constexpr GCGLenum TEXTURE26 = 0x84DA;
    static constexpr GCGLenum TEXTURE27 = 0x84DB;
    static constexpr GCGLenum TEXTURE28 = 0x84DC;
    static constexpr GCGLenum TEXTURE29 = 0x84DD;
    static constexpr GCGLenum TEXTURE30 = 0x84DE;
    static constexpr GCGLenum TEXTURE31 = 0x84DF;
    static constexpr GCGLenum ACTIVE_TEXTURE = 0x84E0;
    static constexpr GCGLenum REPEAT = 0x2901;
    static constexpr GCGLenum CLAMP_TO_EDGE = 0x812F;
    static constexpr GCGLenum MIRRORED_REPEAT = 0x8370;
    static constexpr GCGLenum FLOAT_VEC2 = 0x8B50;
    static constexpr GCGLenum FLOAT_VEC3 = 0x8B51;
    static constexpr GCGLenum FLOAT_VEC4 = 0x8B52;
    static constexpr GCGLenum INT_VEC2 = 0x8B53;
    static constexpr GCGLenum INT_VEC3 = 0x8B54;
    static constexpr GCGLenum INT_VEC4 = 0x8B55;
    static constexpr GCGLenum BOOL = 0x8B56;
    static constexpr GCGLenum BOOL_VEC2 = 0x8B57;
    static constexpr GCGLenum BOOL_VEC3 = 0x8B58;
    static constexpr GCGLenum BOOL_VEC4 = 0x8B59;
    static constexpr GCGLenum FLOAT_MAT2 = 0x8B5A;
    static constexpr GCGLenum FLOAT_MAT3 = 0x8B5B;
    static constexpr GCGLenum FLOAT_MAT4 = 0x8B5C;
    static constexpr GCGLenum SAMPLER_2D = 0x8B5E;
    static constexpr GCGLenum SAMPLER_CUBE = 0x8B60;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886A;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F;
    static constexpr GCGLenum IMPLEMENTATION_COLOR_READ_TYPE = 0x8B9A;
    static constexpr GCGLenum IMPLEMENTATION_COLOR_READ_FORMAT = 0x8B9B;
    static constexpr GCGLenum COMPILE_STATUS = 0x8B81;
    static constexpr GCGLenum INFO_LOG_LENGTH = 0x8B84;
    static constexpr GCGLenum SHADER_SOURCE_LENGTH = 0x8B88;
    static constexpr GCGLenum SHADER_COMPILER = 0x8DFA;
    static constexpr GCGLenum SHADER_BINARY_FORMATS = 0x8DF8;
    static constexpr GCGLenum NUM_SHADER_BINARY_FORMATS = 0x8DF9;
    static constexpr GCGLenum LOW_FLOAT = 0x8DF0;
    static constexpr GCGLenum MEDIUM_FLOAT = 0x8DF1;
    static constexpr GCGLenum HIGH_FLOAT = 0x8DF2;
    static constexpr GCGLenum LOW_INT = 0x8DF3;
    static constexpr GCGLenum MEDIUM_INT = 0x8DF4;
    static constexpr GCGLenum HIGH_INT = 0x8DF5;
    static constexpr GCGLenum FRAMEBUFFER = 0x8D40;
    static constexpr GCGLenum RENDERBUFFER = 0x8D41;
    static constexpr GCGLenum RGBA4 = 0x8056;
    static constexpr GCGLenum RGB5_A1 = 0x8057;
    static constexpr GCGLenum RGB565 = 0x8D62;
    static constexpr GCGLenum DEPTH_COMPONENT16 = 0x81A5;
    static constexpr GCGLenum STENCIL_INDEX8 = 0x8D48;
    static constexpr GCGLenum RENDERBUFFER_WIDTH = 0x8D42;
    static constexpr GCGLenum RENDERBUFFER_HEIGHT = 0x8D43;
    static constexpr GCGLenum RENDERBUFFER_INTERNAL_FORMAT = 0x8D44;
    static constexpr GCGLenum RENDERBUFFER_RED_SIZE = 0x8D50;
    static constexpr GCGLenum RENDERBUFFER_GREEN_SIZE = 0x8D51;
    static constexpr GCGLenum RENDERBUFFER_BLUE_SIZE = 0x8D52;
    static constexpr GCGLenum RENDERBUFFER_ALPHA_SIZE = 0x8D53;
    static constexpr GCGLenum RENDERBUFFER_DEPTH_SIZE = 0x8D54;
    static constexpr GCGLenum RENDERBUFFER_STENCIL_SIZE = 0x8D55;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 0x8CD0;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 0x8CD1;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 0x8CD2;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 0x8CD3;
    static constexpr GCGLenum COLOR_ATTACHMENT0 = 0x8CE0;
    static constexpr GCGLenum DEPTH_ATTACHMENT = 0x8D00;
    static constexpr GCGLenum STENCIL_ATTACHMENT = 0x8D20;
    static constexpr GCGLenum NONE = 0;
    static constexpr GCGLenum FRAMEBUFFER_COMPLETE = 0x8CD5;
    static constexpr GCGLenum FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
    static constexpr GCGLenum FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
    static constexpr GCGLenum FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
    static constexpr GCGLenum FRAMEBUFFER_UNSUPPORTED = 0x8CDD;
    static constexpr GCGLenum FRAMEBUFFER_BINDING = 0x8CA6;
    static constexpr GCGLenum RENDERBUFFER_BINDING = 0x8CA7;
    static constexpr GCGLenum MAX_RENDERBUFFER_SIZE = 0x84E8;
    static constexpr GCGLenum INVALID_FRAMEBUFFER_OPERATION = 0x0506;

    // WebGL-specific enums
    static constexpr GCGLenum UNPACK_FLIP_Y_WEBGL = 0x9240;
    static constexpr GCGLenum UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
    static constexpr GCGLenum CONTEXT_LOST_WEBGL = 0x9242;
    static constexpr GCGLenum UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
    static constexpr GCGLenum BROWSER_DEFAULT_WEBGL = 0x9244;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = 0x88FE;

    // WebGL2 constants
    static constexpr GCGLenum READ_BUFFER = 0x0C02;
    static constexpr GCGLenum UNPACK_ROW_LENGTH = 0x0CF2;
    static constexpr GCGLenum UNPACK_SKIP_ROWS = 0x0CF3;
    static constexpr GCGLenum UNPACK_SKIP_PIXELS = 0x0CF4;
    static constexpr GCGLenum PACK_ROW_LENGTH = 0x0D02;
    static constexpr GCGLenum PACK_SKIP_ROWS = 0x0D03;
    static constexpr GCGLenum PACK_SKIP_PIXELS = 0x0D04;
    static constexpr GCGLenum COLOR = 0x1800;
    static constexpr GCGLenum DEPTH = 0x1801;
    static constexpr GCGLenum STENCIL = 0x1802;
    static constexpr GCGLenum RED = 0x1903;
    static constexpr GCGLenum RGB8 = 0x8051;
    static constexpr GCGLenum RGBA8 = 0x8058;
    static constexpr GCGLenum RGB10_A2 = 0x8059;
    static constexpr GCGLenum TEXTURE_BINDING_3D = 0x806A;
    static constexpr GCGLenum UNPACK_SKIP_IMAGES = 0x806D;
    static constexpr GCGLenum UNPACK_IMAGE_HEIGHT = 0x806E;
    static constexpr GCGLenum TEXTURE_3D = 0x806F;
    static constexpr GCGLenum TEXTURE_WRAP_R = 0x8072;
    static constexpr GCGLenum MAX_3D_TEXTURE_SIZE = 0x8073;
    static constexpr GCGLenum UNSIGNED_INT_2_10_10_10_REV = 0x8368;
    static constexpr GCGLenum MAX_ELEMENTS_VERTICES = 0x80E8;
    static constexpr GCGLenum MAX_ELEMENTS_INDICES = 0x80E9;
    static constexpr GCGLenum TEXTURE_MIN_LOD = 0x813A;
    static constexpr GCGLenum TEXTURE_MAX_LOD = 0x813B;
    static constexpr GCGLenum TEXTURE_BASE_LEVEL = 0x813C;
    static constexpr GCGLenum TEXTURE_MAX_LEVEL = 0x813D;
    static constexpr GCGLenum MIN = 0x8007;
    static constexpr GCGLenum MAX = 0x8008;
    static constexpr GCGLenum DEPTH_COMPONENT24 = 0x81A6;
    static constexpr GCGLenum MAX_TEXTURE_LOD_BIAS = 0x84FD;
    static constexpr GCGLenum TEXTURE_COMPARE_MODE = 0x884C;
    static constexpr GCGLenum TEXTURE_COMPARE_FUNC = 0x884D;
    static constexpr GCGLenum CURRENT_QUERY = 0x8865;
    static constexpr GCGLenum QUERY_RESULT = 0x8866;
    static constexpr GCGLenum QUERY_RESULT_AVAILABLE = 0x8867;
    static constexpr GCGLenum STREAM_READ = 0x88E1;
    static constexpr GCGLenum STREAM_COPY = 0x88E2;
    static constexpr GCGLenum STATIC_READ = 0x88E5;
    static constexpr GCGLenum STATIC_COPY = 0x88E6;
    static constexpr GCGLenum DYNAMIC_READ = 0x88E9;
    static constexpr GCGLenum DYNAMIC_COPY = 0x88EA;
    static constexpr GCGLenum MAX_DRAW_BUFFERS = 0x8824;
    static constexpr GCGLenum DRAW_BUFFER0 = 0x8825;
    static constexpr GCGLenum DRAW_BUFFER1 = 0x8826;
    static constexpr GCGLenum DRAW_BUFFER2 = 0x8827;
    static constexpr GCGLenum DRAW_BUFFER3 = 0x8828;
    static constexpr GCGLenum DRAW_BUFFER4 = 0x8829;
    static constexpr GCGLenum DRAW_BUFFER5 = 0x882A;
    static constexpr GCGLenum DRAW_BUFFER6 = 0x882B;
    static constexpr GCGLenum DRAW_BUFFER7 = 0x882C;
    static constexpr GCGLenum DRAW_BUFFER8 = 0x882D;
    static constexpr GCGLenum DRAW_BUFFER9 = 0x882E;
    static constexpr GCGLenum DRAW_BUFFER10 = 0x882F;
    static constexpr GCGLenum DRAW_BUFFER11 = 0x8830;
    static constexpr GCGLenum DRAW_BUFFER12 = 0x8831;
    static constexpr GCGLenum DRAW_BUFFER13 = 0x8832;
    static constexpr GCGLenum DRAW_BUFFER14 = 0x8833;
    static constexpr GCGLenum DRAW_BUFFER15 = 0x8834;
    static constexpr GCGLenum MAX_FRAGMENT_UNIFORM_COMPONENTS = 0x8B49;
    static constexpr GCGLenum MAX_VERTEX_UNIFORM_COMPONENTS = 0x8B4A;
    static constexpr GCGLenum SAMPLER_3D = 0x8B5F;
    static constexpr GCGLenum SAMPLER_2D_SHADOW = 0x8B62;
    static constexpr GCGLenum FRAGMENT_SHADER_DERIVATIVE_HINT = 0x8B8B;
    static constexpr GCGLenum PIXEL_PACK_BUFFER = 0x88EB;
    static constexpr GCGLenum PIXEL_UNPACK_BUFFER = 0x88EC;
    static constexpr GCGLenum PIXEL_PACK_BUFFER_BINDING = 0x88ED;
    static constexpr GCGLenum PIXEL_UNPACK_BUFFER_BINDING = 0x88EF;
    static constexpr GCGLenum FLOAT_MAT2x3 = 0x8B65;
    static constexpr GCGLenum FLOAT_MAT2x4 = 0x8B66;
    static constexpr GCGLenum FLOAT_MAT3x2 = 0x8B67;
    static constexpr GCGLenum FLOAT_MAT3x4 = 0x8B68;
    static constexpr GCGLenum FLOAT_MAT4x2 = 0x8B69;
    static constexpr GCGLenum FLOAT_MAT4x3 = 0x8B6A;
    static constexpr GCGLenum SRGB = 0x8C40;
    static constexpr GCGLenum SRGB8 = 0x8C41;
    static constexpr GCGLenum SRGB_ALPHA = 0x8C42;
    static constexpr GCGLenum SRGB8_ALPHA8 = 0x8C43;
    static constexpr GCGLenum COMPARE_REF_TO_TEXTURE = 0x884E;
    static constexpr GCGLenum RGBA32F = 0x8814;
    static constexpr GCGLenum RGB32F = 0x8815;
    static constexpr GCGLenum RGBA16F = 0x881A;
    static constexpr GCGLenum RGB16F = 0x881B;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_INTEGER = 0x88FD;
    static constexpr GCGLenum MAX_ARRAY_TEXTURE_LAYERS = 0x88FF;
    static constexpr GCGLenum MIN_PROGRAM_TEXEL_OFFSET = 0x8904;
    static constexpr GCGLenum MAX_PROGRAM_TEXEL_OFFSET = 0x8905;
    static constexpr GCGLenum MAX_VARYING_COMPONENTS = 0x8B4B;
    static constexpr GCGLenum TEXTURE_2D_ARRAY = 0x8C1A;
    static constexpr GCGLenum TEXTURE_BINDING_2D_ARRAY = 0x8C1D;
    static constexpr GCGLenum R11F_G11F_B10F = 0x8C3A;
    static constexpr GCGLenum UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
    static constexpr GCGLenum RGB9_E5 = 0x8C3D;
    static constexpr GCGLenum UNSIGNED_INT_5_9_9_9_REV = 0x8C3E;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH = 0x8C76;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_BUFFER_MODE = 0x8C7F;
    static constexpr GCGLenum MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS = 0x8C80;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_VARYINGS = 0x8C83;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_BUFFER_START = 0x8C84;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_BUFFER_SIZE = 0x8C85;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = 0x8C88;
    static constexpr GCGLenum RASTERIZER_DISCARD = 0x8C89;
    static constexpr GCGLenum MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS = 0x8C8A;
    static constexpr GCGLenum MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS = 0x8C8B;
    static constexpr GCGLenum INTERLEAVED_ATTRIBS = 0x8C8C;
    static constexpr GCGLenum SEPARATE_ATTRIBS = 0x8C8D;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_BUFFER = 0x8C8E;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_BUFFER_BINDING = 0x8C8F;
    static constexpr GCGLenum RGBA32UI = 0x8D70;
    static constexpr GCGLenum RGB32UI = 0x8D71;
    static constexpr GCGLenum RGBA16UI = 0x8D76;
    static constexpr GCGLenum RGB16UI = 0x8D77;
    static constexpr GCGLenum RGBA8UI = 0x8D7C;
    static constexpr GCGLenum RGB8UI = 0x8D7D;
    static constexpr GCGLenum RGBA32I = 0x8D82;
    static constexpr GCGLenum RGB32I = 0x8D83;
    static constexpr GCGLenum RGBA16I = 0x8D88;
    static constexpr GCGLenum RGB16I = 0x8D89;
    static constexpr GCGLenum RGBA8I = 0x8D8E;
    static constexpr GCGLenum RGB8I = 0x8D8F;
    static constexpr GCGLenum RED_INTEGER = 0x8D94;
    static constexpr GCGLenum RGB_INTEGER = 0x8D98;
    static constexpr GCGLenum RGBA_INTEGER = 0x8D99;
    static constexpr GCGLenum SAMPLER_2D_ARRAY = 0x8DC1;
    static constexpr GCGLenum SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
    static constexpr GCGLenum SAMPLER_CUBE_SHADOW = 0x8DC5;
    static constexpr GCGLenum UNSIGNED_INT_VEC2 = 0x8DC6;
    static constexpr GCGLenum UNSIGNED_INT_VEC3 = 0x8DC7;
    static constexpr GCGLenum UNSIGNED_INT_VEC4 = 0x8DC8;
    static constexpr GCGLenum INT_SAMPLER_2D = 0x8DCA;
    static constexpr GCGLenum INT_SAMPLER_3D = 0x8DCB;
    static constexpr GCGLenum INT_SAMPLER_CUBE = 0x8DCC;
    static constexpr GCGLenum INT_SAMPLER_2D_ARRAY = 0x8DCF;
    static constexpr GCGLenum UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
    static constexpr GCGLenum UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
    static constexpr GCGLenum UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
    static constexpr GCGLenum UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;
    static constexpr GCGLenum DEPTH_COMPONENT32F = 0x8CAC;
    static constexpr GCGLenum DEPTH32F_STENCIL8 = 0x8CAD;
    static constexpr GCGLenum FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8DAD;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = 0x8210;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE = 0x8211;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_RED_SIZE = 0x8212;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_GREEN_SIZE = 0x8213;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_BLUE_SIZE = 0x8214;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE = 0x8215;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE = 0x8216;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE = 0x8217;
    static constexpr GCGLenum FRAMEBUFFER_DEFAULT = 0x8218;
    static constexpr GCGLenum DEPTH_STENCIL_ATTACHMENT = 0x821A;
    static constexpr GCGLenum DEPTH_STENCIL = 0x84F9;
    static constexpr GCGLenum UNSIGNED_INT_24_8 = 0x84FA;
    static constexpr GCGLenum DEPTH24_STENCIL8 = 0x88F0;
    static constexpr GCGLenum UNSIGNED_NORMALIZED = 0x8C17;
    static constexpr GCGLenum DRAW_FRAMEBUFFER_BINDING = 0x8CA6; /* Same as FRAMEBUFFER_BINDING */
    static constexpr GCGLenum READ_FRAMEBUFFER = 0x8CA8;
    static constexpr GCGLenum DRAW_FRAMEBUFFER = 0x8CA9;
    static constexpr GCGLenum READ_FRAMEBUFFER_BINDING = 0x8CAA;
    static constexpr GCGLenum RENDERBUFFER_SAMPLES = 0x8CAB;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER = 0x8CD4;
    static constexpr GCGLenum MAX_COLOR_ATTACHMENTS = 0x8CDF;
    static constexpr GCGLenum COLOR_ATTACHMENT1 = 0x8CE1;
    static constexpr GCGLenum COLOR_ATTACHMENT2 = 0x8CE2;
    static constexpr GCGLenum COLOR_ATTACHMENT3 = 0x8CE3;
    static constexpr GCGLenum COLOR_ATTACHMENT4 = 0x8CE4;
    static constexpr GCGLenum COLOR_ATTACHMENT5 = 0x8CE5;
    static constexpr GCGLenum COLOR_ATTACHMENT6 = 0x8CE6;
    static constexpr GCGLenum COLOR_ATTACHMENT7 = 0x8CE7;
    static constexpr GCGLenum COLOR_ATTACHMENT8 = 0x8CE8;
    static constexpr GCGLenum COLOR_ATTACHMENT9 = 0x8CE9;
    static constexpr GCGLenum COLOR_ATTACHMENT10 = 0x8CEA;
    static constexpr GCGLenum COLOR_ATTACHMENT11 = 0x8CEB;
    static constexpr GCGLenum COLOR_ATTACHMENT12 = 0x8CEC;
    static constexpr GCGLenum COLOR_ATTACHMENT13 = 0x8CED;
    static constexpr GCGLenum COLOR_ATTACHMENT14 = 0x8CEE;
    static constexpr GCGLenum COLOR_ATTACHMENT15 = 0x8CEF;
    static constexpr GCGLenum FRAMEBUFFER_INCOMPLETE_MULTISAMPLE = 0x8D56;
    static constexpr GCGLenum MAX_SAMPLES = 0x8D57;
    static constexpr GCGLenum HALF_FLOAT = 0x140B;
    static constexpr GCGLenum RG = 0x8227;
    static constexpr GCGLenum RG_INTEGER = 0x8228;
    static constexpr GCGLenum R8 = 0x8229;
    static constexpr GCGLenum RG8 = 0x822B;
    static constexpr GCGLenum R16F = 0x822D;
    static constexpr GCGLenum R32F = 0x822E;
    static constexpr GCGLenum RG16F = 0x822F;
    static constexpr GCGLenum RG32F = 0x8230;
    static constexpr GCGLenum R8I = 0x8231;
    static constexpr GCGLenum R8UI = 0x8232;
    static constexpr GCGLenum R16I = 0x8233;
    static constexpr GCGLenum R16UI = 0x8234;
    static constexpr GCGLenum R32I = 0x8235;
    static constexpr GCGLenum R32UI = 0x8236;
    static constexpr GCGLenum RG8I = 0x8237;
    static constexpr GCGLenum RG8UI = 0x8238;
    static constexpr GCGLenum RG16I = 0x8239;
    static constexpr GCGLenum RG16UI = 0x823A;
    static constexpr GCGLenum RG32I = 0x823B;
    static constexpr GCGLenum RG32UI = 0x823C;
    static constexpr GCGLenum VERTEX_ARRAY_BINDING = 0x85B5;
    static constexpr GCGLenum VERTEX_ARRAY_BINDING_OES = 0x85B5;
    static constexpr GCGLenum R8_SNORM = 0x8F94;
    static constexpr GCGLenum RG8_SNORM = 0x8F95;
    static constexpr GCGLenum RGB8_SNORM = 0x8F96;
    static constexpr GCGLenum RGBA8_SNORM = 0x8F97;
    static constexpr GCGLenum SIGNED_NORMALIZED = 0x8F9C;
    static constexpr GCGLenum COPY_READ_BUFFER = 0x8F36;
    static constexpr GCGLenum COPY_WRITE_BUFFER = 0x8F37;
    static constexpr GCGLenum COPY_READ_BUFFER_BINDING = 0x8F36; /* Same as COPY_READ_BUFFER */
    static constexpr GCGLenum COPY_WRITE_BUFFER_BINDING = 0x8F37; /* Same as COPY_WRITE_BUFFER */
    static constexpr GCGLenum UNIFORM_BUFFER = 0x8A11;
    static constexpr GCGLenum UNIFORM_BUFFER_BINDING = 0x8A28;
    static constexpr GCGLenum UNIFORM_BUFFER_START = 0x8A29;
    static constexpr GCGLenum UNIFORM_BUFFER_SIZE = 0x8A2A;
    static constexpr GCGLenum MAX_VERTEX_UNIFORM_BLOCKS = 0x8A2B;
    static constexpr GCGLenum MAX_FRAGMENT_UNIFORM_BLOCKS = 0x8A2D;
    static constexpr GCGLenum MAX_COMBINED_UNIFORM_BLOCKS = 0x8A2E;
    static constexpr GCGLenum MAX_UNIFORM_BUFFER_BINDINGS = 0x8A2F;
    static constexpr GCGLenum MAX_UNIFORM_BLOCK_SIZE = 0x8A30;
    static constexpr GCGLenum MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS = 0x8A31;
    static constexpr GCGLenum MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS = 0x8A33;
    static constexpr GCGLenum UNIFORM_BUFFER_OFFSET_ALIGNMENT = 0x8A34;
    static constexpr GCGLenum ACTIVE_UNIFORM_BLOCKS = 0x8A36;
    static constexpr GCGLenum UNIFORM_TYPE = 0x8A37;
    static constexpr GCGLenum UNIFORM_SIZE = 0x8A38;
    static constexpr GCGLenum UNIFORM_BLOCK_INDEX = 0x8A3A;
    static constexpr GCGLenum UNIFORM_OFFSET = 0x8A3B;
    static constexpr GCGLenum UNIFORM_ARRAY_STRIDE = 0x8A3C;
    static constexpr GCGLenum UNIFORM_MATRIX_STRIDE = 0x8A3D;
    static constexpr GCGLenum UNIFORM_IS_ROW_MAJOR = 0x8A3E;
    static constexpr GCGLenum UNIFORM_BLOCK_BINDING = 0x8A3F;
    static constexpr GCGLenum UNIFORM_BLOCK_DATA_SIZE = 0x8A40;
    static constexpr GCGLenum UNIFORM_BLOCK_ACTIVE_UNIFORMS = 0x8A42;
    static constexpr GCGLenum UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = 0x8A43;
    static constexpr GCGLenum UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = 0x8A44;
    static constexpr GCGLenum UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 0x8A46;
    static constexpr GCGLenum INVALID_INDEX = 0xFFFFFFFF;
    static constexpr GCGLenum MAX_VERTEX_OUTPUT_COMPONENTS = 0x9122;
    static constexpr GCGLenum MAX_FRAGMENT_INPUT_COMPONENTS = 0x9125;
    static constexpr GCGLenum MAX_SERVER_WAIT_TIMEOUT = 0x9111;
    static constexpr GCGLenum OBJECT_TYPE = 0x9112;
    static constexpr GCGLenum SYNC_CONDITION = 0x9113;
    static constexpr GCGLenum SYNC_STATUS = 0x9114;
    static constexpr GCGLenum SYNC_FLAGS = 0x9115;
    static constexpr GCGLenum SYNC_FENCE = 0x9116;
    static constexpr GCGLenum SYNC_GPU_COMMANDS_COMPLETE = 0x9117;
    static constexpr GCGLenum UNSIGNALED = 0x9118;
    static constexpr GCGLenum SIGNALED = 0x9119;
    static constexpr GCGLenum ALREADY_SIGNALED = 0x911A;
    static constexpr GCGLenum TIMEOUT_EXPIRED = 0x911B;
    static constexpr GCGLenum CONDITION_SATISFIED = 0x911C;
    static constexpr GCGLenum WAIT_FAILED_WEBGL = 0x911D;
    static constexpr GCGLenum SYNC_FLUSH_COMMANDS_BIT = 0x00000001;
    static constexpr GCGLenum VERTEX_ATTRIB_ARRAY_DIVISOR = 0x88FE;
    static constexpr GCGLenum ANY_SAMPLES_PASSED = 0x8C2F;
    static constexpr GCGLenum ANY_SAMPLES_PASSED_CONSERVATIVE = 0x8D6A;
    static constexpr GCGLenum SAMPLER_BINDING = 0x8919;
    static constexpr GCGLenum RGB10_A2UI = 0x906F;
    static constexpr GCGLenum TEXTURE_SWIZZLE_R = 0x8E42;
    static constexpr GCGLenum TEXTURE_SWIZZLE_G = 0x8E43;
    static constexpr GCGLenum TEXTURE_SWIZZLE_B = 0x8E44;
    static constexpr GCGLenum TEXTURE_SWIZZLE_A = 0x8E45;
    static constexpr GCGLenum GREEN = 0x1904;
    static constexpr GCGLenum BLUE = 0x1905;
    static constexpr GCGLenum INT_2_10_10_10_REV = 0x8D9F;
    static constexpr GCGLenum TRANSFORM_FEEDBACK = 0x8E22;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_PAUSED = 0x8E23;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_ACTIVE = 0x8E24;
    static constexpr GCGLenum TRANSFORM_FEEDBACK_BINDING = 0x8E25;
    static constexpr GCGLenum COMPRESSED_R11_EAC = 0x9270;
    static constexpr GCGLenum COMPRESSED_SIGNED_R11_EAC = 0x9271;
    static constexpr GCGLenum COMPRESSED_RG11_EAC = 0x9272;
    static constexpr GCGLenum COMPRESSED_SIGNED_RG11_EAC = 0x9273;
    static constexpr GCGLenum COMPRESSED_RGB8_ETC2 = 0x9274;
    static constexpr GCGLenum COMPRESSED_SRGB8_ETC2 = 0x9275;
    static constexpr GCGLenum COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9276;
    static constexpr GCGLenum COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9277;
    static constexpr GCGLenum COMPRESSED_RGBA8_ETC2_EAC = 0x9278;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 0x9279;
    static constexpr GCGLenum TEXTURE_IMMUTABLE_FORMAT = 0x912F;
    static constexpr GCGLenum MAX_ELEMENT_INDEX = 0x8D6B;
    static constexpr GCGLenum NUM_SAMPLE_COUNTS = 0x9380;
    static constexpr GCGLenum TEXTURE_IMMUTABLE_LEVELS = 0x82DF;
    static constexpr GCGLenum PRIMITIVE_RESTART_FIXED_INDEX = 0x8D69;
    static constexpr GCGLenum PRIMITIVE_RESTART = 0x8F9D;

    // OpenGL ES 3 constants.
    static constexpr GCGLenum MAP_READ_BIT = 0x0001;

    // WebGL-specific.
    static constexpr GCGLenum MAX_CLIENT_WAIT_TIMEOUT_WEBGL = 0x9247;

    // Necessary desktop OpenGL constants.
    static constexpr GCGLenum TEXTURE_RECTANGLE_ARB = 0x84F5;
    static constexpr GCGLenum TEXTURE_BINDING_RECTANGLE_ARB = 0x84F6;

    // EXT_sRGB formats
    static constexpr GCGLenum SRGB_EXT = 0x8C40;
    static constexpr GCGLenum SRGB_ALPHA_EXT = 0x8C42;
    static constexpr GCGLenum SRGB8_ALPHA8_EXT = 0x8C43;
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = 0x8210;

    // EXT_color_buffer_half_float
    static constexpr GCGLenum FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT = 0x8211;

    // GL_EXT_depth_clamp
    static constexpr GCGLenum DEPTH_CLAMP_EXT = 0x864F;

    // GL_EXT_disjoint_timer_query
    static constexpr GCGLenum QUERY_COUNTER_BITS_EXT = 0x8864;
    static constexpr GCGLenum CURRENT_QUERY_EXT = 0x8865;
    static constexpr GCGLenum QUERY_RESULT_EXT = 0x8866;
    static constexpr GCGLenum QUERY_RESULT_AVAILABLE_EXT = 0x8867;
    static constexpr GCGLenum TIME_ELAPSED_EXT = 0x88BF;
    static constexpr GCGLenum TIMESTAMP_EXT = 0x8E28;
    static constexpr GCGLenum GPU_DISJOINT_EXT = 0x8FBB;

    // EXT_blend_minmax enums
    static constexpr GCGLenum MIN_EXT = 0x8007;
    static constexpr GCGLenum MAX_EXT = 0x8008;

    // GL_EXT_texture_format_BGRA8888 enums
    static constexpr GCGLenum BGRA_EXT = 0x80E1;

    // GL_ARB_robustness enums
    static constexpr GCGLenum GUILTY_CONTEXT_RESET_ARB = 0x8253;
    static constexpr GCGLenum INNOCENT_CONTEXT_RESET_ARB = 0x8254;
    static constexpr GCGLenum UNKNOWN_CONTEXT_RESET_ARB = 0x8255;
    static constexpr GCGLenum CONTEXT_ROBUST_ACCESS = 0x90F3;

    // GL_OES_standard_derivatives names
    static constexpr GCGLenum FRAGMENT_SHADER_DERIVATIVE_HINT_OES = 0x8B8B;

    // GL_OES_rgb8_rgba8 names
    static constexpr GCGLenum RGB8_OES = 0x8051;
    static constexpr GCGLenum RGBA8_OES = 0x8058;

    // GL_ANGLE_translated_shader_source
    static constexpr GCGLenum TRANSLATED_SHADER_SOURCE_LENGTH_ANGLE = 0x93A0;

    // GL_EXT_texture_compression_dxt1
    // GL_EXT_texture_compression_s3tc
    static constexpr GCGLenum COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
    static constexpr GCGLenum COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
    static constexpr GCGLenum COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
    static constexpr GCGLenum COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

    // GL_EXT_texture_compression_s3tc_srgb
    static constexpr GCGLenum COMPRESSED_SRGB_S3TC_DXT1_EXT = 0x8C4C;
    static constexpr GCGLenum COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 0x8C4D;
    static constexpr GCGLenum COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 0x8C4E;
    static constexpr GCGLenum COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 0x8C4F;

    // GL_OES_compressed_ETC1_RGB8_texture
    static constexpr GCGLenum ETC1_RGB8_OES = 0x8D64;

    // GL_IMG_texture_compression_pvrtc
    static constexpr GCGLenum COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
    static constexpr GCGLenum COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
    static constexpr GCGLenum COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
    static constexpr GCGLenum COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

    // GL_AMD_compressed_ATC_texture
    static constexpr GCGLenum COMPRESSED_ATC_RGB_AMD = 0x8C92;
    static constexpr GCGLenum COMPRESSED_ATC_RGBA_EXPLICIT_ALPHA_AMD = 0x8C93;
    static constexpr GCGLenum COMPRESSED_ATC_RGBA_INTERPOLATED_ALPHA_AMD = 0x87EE;

    // GL_KHR_texture_compression_astc_hdr
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_5x4_KHR = 0x93B1;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_5x5_KHR = 0x93B2;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_6x5_KHR = 0x93B3;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_6x6_KHR = 0x93B4;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_8x5_KHR = 0x93B5;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_8x6_KHR = 0x93B6;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_8x8_KHR = 0x93B7;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_10x5_KHR = 0x93B8;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_10x6_KHR = 0x93B9;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_10x8_KHR = 0x93BA;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_10x10_KHR = 0x93BB;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_12x10_KHR = 0x93BC;
    static constexpr GCGLenum COMPRESSED_RGBA_ASTC_12x12_KHR = 0x93BD;

    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 0x93D0;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR = 0x93D1;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR = 0x93D2;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR = 0x93D3;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR = 0x93D4;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR = 0x93D5;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR = 0x93D6;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR = 0x93D7;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR = 0x93D8;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR = 0x93D9;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR = 0x93DA;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR = 0x93DB;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR = 0x93DC;
    static constexpr GCGLenum COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR = 0x93DD;

    // GL_EXT_texture_compression_bptc
    static constexpr GCGLenum COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
    static constexpr GCGLenum COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT = 0x8E8D;
    static constexpr GCGLenum COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT = 0x8E8E;
    static constexpr GCGLenum COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT = 0x8E8F;

    // GL_EXT_texture_compression_rgtc
    static constexpr GCGLenum COMPRESSED_RED_RGTC1_EXT = 0x8DBB;
    static constexpr GCGLenum COMPRESSED_SIGNED_RED_RGTC1_EXT = 0x8DBC;
    static constexpr GCGLenum COMPRESSED_RED_GREEN_RGTC2_EXT = 0x8DBD;
    static constexpr GCGLenum COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT = 0x8DBE;

    // GL_EXT_texture_filter_anisotropic
    static constexpr GCGLenum TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;
    static constexpr GCGLenum MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

    // GL_EXT_texture_mirror_clamp_to_edge
    static constexpr GCGLenum MIRROR_CLAMP_TO_EDGE_EXT = 0x8743;

    // GL_EXT_texture_norm16
    static constexpr GCGLenum R16_EXT = 0x822A;
    static constexpr GCGLenum RG16_EXT = 0x822C;
    static constexpr GCGLenum RGB16_EXT = 0x8054;
    static constexpr GCGLenum RGBA16_EXT = 0x805B;
    static constexpr GCGLenum R16_SNORM_EXT = 0x8F98;
    static constexpr GCGLenum RG16_SNORM_EXT = 0x8F99;
    static constexpr GCGLenum RGB16_SNORM_EXT = 0x8F9A;
    static constexpr GCGLenum RGBA16_SNORM_EXT = 0x8F9B;

    // GL_EXT_clip_control
    static constexpr GCGLenum LOWER_LEFT_EXT = 0x8CA1;
    static constexpr GCGLenum UPPER_LEFT_EXT = 0x8CA2;
    static constexpr GCGLenum NEGATIVE_ONE_TO_ONE_EXT = 0x935E;
    static constexpr GCGLenum ZERO_TO_ONE_EXT = 0x935F;
    static constexpr GCGLenum CLIP_ORIGIN_EXT = 0x935C;
    static constexpr GCGLenum CLIP_DEPTH_MODE_EXT = 0x935D;

    // GL_ANGLE_clip_cull_distance
    static constexpr GCGLenum MAX_CLIP_DISTANCES_ANGLE = 0x0D32;
    static constexpr GCGLenum MAX_CULL_DISTANCES_ANGLE = 0x82F9;
    static constexpr GCGLenum MAX_COMBINED_CLIP_AND_CULL_DISTANCES_ANGLE = 0x82FA;
    static constexpr GCGLenum CLIP_DISTANCE0_ANGLE = 0x3000;
    static constexpr GCGLenum CLIP_DISTANCE1_ANGLE = 0x3001;
    static constexpr GCGLenum CLIP_DISTANCE2_ANGLE = 0x3002;
    static constexpr GCGLenum CLIP_DISTANCE3_ANGLE = 0x3003;
    static constexpr GCGLenum CLIP_DISTANCE4_ANGLE = 0x3004;
    static constexpr GCGLenum CLIP_DISTANCE5_ANGLE = 0x3005;
    static constexpr GCGLenum CLIP_DISTANCE6_ANGLE = 0x3006;
    static constexpr GCGLenum CLIP_DISTANCE7_ANGLE = 0x3007;

    // GL_ANGLE_provoking_vertex
    static constexpr GCGLenum FIRST_VERTEX_CONVENTION_ANGLE = 0x8E4D;
    static constexpr GCGLenum LAST_VERTEX_CONVENTION_ANGLE = 0x8E4E;
    static constexpr GCGLenum PROVOKING_VERTEX_ANGLE = 0x8E4F;

    // GL_ANGLE_polygon_mode
    static constexpr GCGLenum POLYGON_MODE_ANGLE = 0x0B40;
    static constexpr GCGLenum POLYGON_OFFSET_LINE_ANGLE = 0x2A02;
    static constexpr GCGLenum LINE_ANGLE = 0x1B01;
    static constexpr GCGLenum FILL_ANGLE = 0x1B02;

    // GL_EXT_polygon_offset_clamp
    static constexpr GCGLenum POLYGON_OFFSET_CLAMP_EXT = 0x8E1B;

    // GL_OES_shader_multisample_interpolation
    static constexpr GCGLenum MIN_FRAGMENT_INTERPOLATION_OFFSET_OES = 0x8E5B;
    static constexpr GCGLenum MAX_FRAGMENT_INTERPOLATION_OFFSET_OES = 0x8E5C;
    static constexpr GCGLenum FRAGMENT_INTERPOLATION_OFFSET_BITS_OES = 0x8E5D;

    // GL_EXT_blend_func_extended
    static constexpr GCGLenum SRC1_COLOR_EXT = 0x88F9;
    static constexpr GCGLenum SRC1_ALPHA_EXT = 0x8589;
    static constexpr GCGLenum ONE_MINUS_SRC1_COLOR_EXT = 0x88FA;
    static constexpr GCGLenum ONE_MINUS_SRC1_ALPHA_EXT = 0x88FB;
    static constexpr GCGLenum MAX_DUAL_SOURCE_DRAW_BUFFERS_EXT = 0x88FC;

    // GL_ARB_draw_buffers / GL_EXT_draw_buffers
    static constexpr GCGLenum MAX_DRAW_BUFFERS_EXT = 0x8824;
    static constexpr GCGLenum DRAW_BUFFER0_EXT = 0x8825;
    static constexpr GCGLenum DRAW_BUFFER1_EXT = 0x8826;
    static constexpr GCGLenum DRAW_BUFFER2_EXT = 0x8827;
    static constexpr GCGLenum DRAW_BUFFER3_EXT = 0x8828;
    static constexpr GCGLenum DRAW_BUFFER4_EXT = 0x8829;
    static constexpr GCGLenum DRAW_BUFFER5_EXT = 0x882A;
    static constexpr GCGLenum DRAW_BUFFER6_EXT = 0x882B;
    static constexpr GCGLenum DRAW_BUFFER7_EXT = 0x882C;
    static constexpr GCGLenum DRAW_BUFFER8_EXT = 0x882D;
    static constexpr GCGLenum DRAW_BUFFER9_EXT = 0x882E;
    static constexpr GCGLenum DRAW_BUFFER10_EXT = 0x882F;
    static constexpr GCGLenum DRAW_BUFFER11_EXT = 0x8830;
    static constexpr GCGLenum DRAW_BUFFER12_EXT = 0x8831;
    static constexpr GCGLenum DRAW_BUFFER13_EXT = 0x8832;
    static constexpr GCGLenum DRAW_BUFFER14_EXT = 0x8833;
    static constexpr GCGLenum DRAW_BUFFER15_EXT = 0x8834;
    static constexpr GCGLenum MAX_COLOR_ATTACHMENTS_EXT = 0x8CDF;
    static constexpr GCGLenum COLOR_ATTACHMENT0_EXT = 0x8CE0;
    static constexpr GCGLenum COLOR_ATTACHMENT1_EXT = 0x8CE1;
    static constexpr GCGLenum COLOR_ATTACHMENT2_EXT = 0x8CE2;
    static constexpr GCGLenum COLOR_ATTACHMENT3_EXT = 0x8CE3;
    static constexpr GCGLenum COLOR_ATTACHMENT4_EXT = 0x8CE4;
    static constexpr GCGLenum COLOR_ATTACHMENT5_EXT = 0x8CE5;
    static constexpr GCGLenum COLOR_ATTACHMENT6_EXT = 0x8CE6;
    static constexpr GCGLenum COLOR_ATTACHMENT7_EXT = 0x8CE7;
    static constexpr GCGLenum COLOR_ATTACHMENT8_EXT = 0x8CE8;
    static constexpr GCGLenum COLOR_ATTACHMENT9_EXT = 0x8CE9;
    static constexpr GCGLenum COLOR_ATTACHMENT10_EXT = 0x8CEA;
    static constexpr GCGLenum COLOR_ATTACHMENT11_EXT = 0x8CEB;
    static constexpr GCGLenum COLOR_ATTACHMENT12_EXT = 0x8CEC;
    static constexpr GCGLenum COLOR_ATTACHMENT13_EXT = 0x8CED;
    static constexpr GCGLenum COLOR_ATTACHMENT14_EXT = 0x8CEE;
    static constexpr GCGLenum COLOR_ATTACHMENT15_EXT = 0x8CEF;

    // GL_ANGLE_stencil_texturing
    static constexpr GCGLenum DEPTH_STENCIL_TEXTURE_MODE_ANGLE = 0x90EA;
    static constexpr GCGLenum STENCIL_INDEX_ANGLE = 0x1901;

    // GL_KHR_parallel_shader_compile
    static constexpr GCGLenum COMPLETION_STATUS_KHR = 0x91B1;

    // GL_ANGLE_request_extension
    static constexpr GCGLenum REQUESTABLE_EXTENSIONS_ANGLE = 0x93A8;

    // ANGLE special internal formats
    static constexpr GCGLenum BGRA4_ANGLEX = 0x6ABC;
    static constexpr GCGLenum BGR5_A1_ANGLEX = 0x6ABD;
    static constexpr GCGLenum BGRA8_SRGB_ANGLEX = 0x6AC0;
    static constexpr GCGLenum RGBX8_SRGB_ANGLEX = 0x6AFA;

    // GL_OES_depth32
    static constexpr GCGLenum DEPTH_COMPONENT32_OES = 0x81A7;

    // GL_APPLE_texture_format_BGRA8888
    static constexpr GCGLenum BGRA8_EXT = 0x93A1;

    // GL_ANGLE_rgbx_internal_format
    static constexpr GCGLenum RGBX8_ANGLE = 0x96BA;

    // GL_ANGLE_variable_rasterization_rate_metal
    static constexpr GCGLenum VARIABLE_RASTERIZATION_RATE_ANGLE = 0x96BC;
    static constexpr GCGLenum METAL_RASTERIZATION_RATE_MAP_BINDING_ANGLE = 0x96BD;

    // GL_KHR_debug
    static constexpr GCGLenum DEBUG_OUTPUT = 0x92E0;
    static constexpr GCGLenum DEBUG_OUTPUT_SYNCHRONOUS = 0x8242;
    static constexpr GCGLenum DEBUG_TYPE_ERROR = 0x824C;
    static constexpr GCGLenum DEBUG_TYPE_DEPRECATED_BEHAVIOR = 0x824D;
    static constexpr GCGLenum DEBUG_TYPE_UNDEFINED_BEHAVIOR = 0x824E;
    static constexpr GCGLenum DEBUG_TYPE_PORTABILITY = 0x824F;
    static constexpr GCGLenum DEBUG_TYPE_PERFORMANCE = 0x8250;
    static constexpr GCGLenum DEBUG_TYPE_OTHER = 0x8251;
    static constexpr GCGLenum DEBUG_TYPE_MARKER = 0x8268;
    static constexpr GCGLenum DEBUG_SEVERITY_HIGH = 0x9146;
    static constexpr GCGLenum DEBUG_SEVERITY_MEDIUM = 0x9147;
    static constexpr GCGLenum DEBUG_SEVERITY_LOW = 0x9148;
    static constexpr GCGLenum DEBUG_SEVERITY_NOTIFICATION = 0x826B;
    static constexpr GCGLenum DEBUG_SOURCE_API = 0x8246;

    // Attempt to enumerate all possible native image formats to
    // reduce the amount of temporary allocations during texture
    // uploading. This enum must be public because it is accessed
    // by non-member functions.
    // "_S" postfix indicates signed type.
    enum class DataFormat : uint8_t {
        RGBA8 = 0,
        RGBA8_S,
        RGBA16,
        RGBA16_S,
        RGBA16Little, // CoreGraphics-specific source format.
        RGBA16Big, // CoreGraphics-specific source format.
        RGBA32,
        RGBA32_S,
        RGBA16F,
        RGBA32F,
        RGBA2_10_10_10,
        RGB8,
        RGB8_S,
        RGB16,
        RGB16_S,
        RGB16Little, // CoreGraphics-specific source format.
        RGB16Big, // CoreGraphics-specific source format.
        RGB32,
        RGB32_S,
        RGB16F,
        RGB32F,
        BGR8,
        BGRA8,
        BGRA16Little, // CoreGraphics-specific source format.
        BGRA16Big, // CoreGraphics-specific source format.
        ARGB8,
        ARGB16Little, // CoreGraphics-specific source format.
        ARGB16Big, // CoreGraphics-specific source format.
        ABGR8,
        RGBA5551,
        RGBA4444,
        RGB565,
        RGB10F11F11F,
        RGB5999,
        RG8,
        RG8_S,
        RG16,
        RG16_S,
        RG32,
        RG32_S,
        RG16F,
        RG32F,
        R8,
        R8_S,
        R16,
        R16_S,
        R16Little, // CoreGraphics-specific source format.
        R16Big, // CoreGraphics-specific source format.
        R32,
        R32_S,
        R16F,
        R32F,
        RA8,
        RA16Little, // CoreGraphics-specific source format.
        RA16Big, // CoreGraphics-specific source format.
        RA16F,
        RA32F,
        AR8,
        AR16Little, // CoreGraphics-specific source format.
        AR16Big, // CoreGraphics-specific source format.
        A8,
        A16Little, // CoreGraphics-specific source format.
        A16Big, // CoreGraphics-specific source format.
        A16F,
        A32F,
        D16,
        D32,
        D32F,
        DS24_8,
        NumFormats,
        Invalid = NumFormats
    };

    enum class ChannelBits : uint8_t {
        Red = 1,
        Green = 2,
        Blue = 4,
        Alpha = 8,
        Depth = 16,
        Stencil = 32,
        RGB = Red | Green | Blue,
        RGBA = RGB | Alpha,
        DepthStencil = Depth | Stencil,
    };

    // Possible alpha operations that may need to occur during
    // pixel packing. FIXME: kAlphaDoUnmultiply is lossy and must
    // be removed.
    enum AlphaOp : uint8_t {
        DoNothing,
        DoPremultiply,
        DoUnmultiply,
    };

    enum class DOMSource : uint8_t {
        Image,
        Canvas,
        Video,
        DOMSourceNone,
    };

    using FlipY = GraphicsContextGLFlipY;

    virtual RefPtr<GraphicsLayerContentsDisplayDelegate> layerContentsDisplayDelegate() = 0;

    ALWAYS_INLINE static bool hasAlpha(DataFormat format)
    {
        switch (format) {
        case DataFormat::A8:
        case DataFormat::A16F:
        case DataFormat::A32F:
        case DataFormat::RA8:
        case DataFormat::AR8:
        case DataFormat::RA16F:
        case DataFormat::RA32F:
        case DataFormat::RGBA8:
        case DataFormat::BGRA8:
        case DataFormat::ARGB8:
        case DataFormat::ABGR8:
        case DataFormat::RGBA16F:
        case DataFormat::RGBA32F:
        case DataFormat::RGBA4444:
        case DataFormat::RGBA5551:
        case DataFormat::RGBA8_S:
        case DataFormat::RGBA16:
        case DataFormat::RGBA16_S:
        case DataFormat::RGBA32:
        case DataFormat::RGBA32_S:
        case DataFormat::RGBA2_10_10_10:
            return true;
        default:
            return false;
        }
    }

    ALWAYS_INLINE static bool hasColor(DataFormat format)
    {
        switch (format) {
        case DataFormat::RGBA8:
        case DataFormat::RGBA16F:
        case DataFormat::RGBA32F:
        case DataFormat::RGB8:
        case DataFormat::RGB16F:
        case DataFormat::RGB32F:
        case DataFormat::BGR8:
        case DataFormat::BGRA8:
        case DataFormat::ARGB8:
        case DataFormat::ABGR8:
        case DataFormat::RGBA5551:
        case DataFormat::RGBA4444:
        case DataFormat::RGB565:
        case DataFormat::R8:
        case DataFormat::R16F:
        case DataFormat::R32F:
        case DataFormat::RA8:
        case DataFormat::RA16F:
        case DataFormat::RA32F:
        case DataFormat::AR8:
        case DataFormat::RGBA8_S:
        case DataFormat::RGBA16:
        case DataFormat::RGBA16_S:
        case DataFormat::RGBA32:
        case DataFormat::RGBA32_S:
        case DataFormat::RGBA2_10_10_10:
        case DataFormat::RGB8_S:
        case DataFormat::RGB16:
        case DataFormat::RGB16_S:
        case DataFormat::RGB32:
        case DataFormat::RGB32_S:
        case DataFormat::RGB10F11F11F:
        case DataFormat::RGB5999:
        case DataFormat::RG8:
        case DataFormat::RG8_S:
        case DataFormat::RG16:
        case DataFormat::RG16_S:
        case DataFormat::RG32:
        case DataFormat::RG32_S:
        case DataFormat::RG16F:
        case DataFormat::RG32F:
        case DataFormat::R8_S:
        case DataFormat::R16:
        case DataFormat::R16_S:
        case DataFormat::R32:
        case DataFormat::R32_S:
            return true;
        default:
            return false;
        }
    }

    // Check if the format is one of the formats from the ImageData or DOM elements.
    // The formats from ImageData is always RGBA8.
    // The formats from DOM elements vary with Graphics ports. It can only be RGBA8 or BGRA8 for non-CG port while a little more for CG port.
    static ALWAYS_INLINE bool srcFormatComesFromDOMElementOrImageData(DataFormat SrcFormat)
    {
#if USE(CG)
#if CPU(BIG_ENDIAN)
    return SrcFormat == DataFormat::RGBA8 || SrcFormat == DataFormat::ARGB8 || SrcFormat == DataFormat::RGB8
        || SrcFormat == DataFormat::RA8 || SrcFormat == DataFormat::AR8 || SrcFormat == DataFormat::R8 || SrcFormat == DataFormat::A8;
#else
    // That LITTLE_ENDIAN case has more possible formats than BIG_ENDIAN case is because some decoded image data is actually big endian
    // even on little endian architectures.
    return SrcFormat == DataFormat::BGRA8 || SrcFormat == DataFormat::ABGR8 || SrcFormat == DataFormat::BGR8
        || SrcFormat == DataFormat::RGBA8 || SrcFormat == DataFormat::ARGB8 || SrcFormat == DataFormat::RGB8
        || SrcFormat == DataFormat::R8 || SrcFormat == DataFormat::A8
        || SrcFormat == DataFormat::RA8 || SrcFormat == DataFormat::AR8;
#endif
#else
    return SrcFormat == DataFormat::BGRA8 || SrcFormat == DataFormat::RGBA8;
#endif
    }

    static constexpr GCGLErrorCode enumToErrorCode(GCGLenum error)
    {
        switch (error) {
        case INVALID_ENUM:
            return GCGLErrorCode::InvalidEnum;
        case INVALID_VALUE:
            return GCGLErrorCode::InvalidValue;
        case INVALID_OPERATION:
            return GCGLErrorCode::InvalidOperation;
        case OUT_OF_MEMORY:
            return GCGLErrorCode::OutOfMemory;
        case INVALID_FRAMEBUFFER_OPERATION:
            return GCGLErrorCode::InvalidFramebufferOperation;
        case CONTEXT_LOST_WEBGL:
            return GCGLErrorCode::ContextLost;
        }
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return GCGLErrorCode::InvalidOperation;
    }

    class Client {
    public:
        WEBCORE_EXPORT Client();
        WEBCORE_EXPORT virtual ~Client();
        virtual void forceContextLost() = 0;
        virtual void addDebugMessage(GCGLenum, GCGLenum, GCGLenum, const String&) = 0;
    };

    WEBCORE_EXPORT GraphicsContextGL(GraphicsContextGLAttributes);
    WEBCORE_EXPORT virtual ~GraphicsContextGL();

    void setClient(Client* client) { m_client = client; }

    // ========== WebGL 1 entry points.
    virtual void activeTexture(GCGLenum texture) = 0;
    virtual void attachShader(PlatformGLObject program, PlatformGLObject shader) = 0;
    virtual void bindAttribLocation(PlatformGLObject, GCGLuint index, const String& name) = 0;
    virtual void bindBuffer(GCGLenum target, PlatformGLObject) = 0;
    virtual void bindFramebuffer(GCGLenum target, PlatformGLObject) = 0;
    virtual void bindRenderbuffer(GCGLenum target, PlatformGLObject) = 0;
    virtual void bindTexture(GCGLenum target, PlatformGLObject) = 0;
    virtual void blendColor(GCGLclampf red, GCGLclampf green, GCGLclampf blue, GCGLclampf alpha) = 0;
    virtual void blendEquation(GCGLenum mode) = 0;
    virtual void blendEquationSeparate(GCGLenum modeRGB, GCGLenum modeAlpha) = 0;
    virtual void blendFunc(GCGLenum sfactor, GCGLenum dfactor) = 0;
    virtual void blendFuncSeparate(GCGLenum srcRGB, GCGLenum dstRGB, GCGLenum srcAlpha, GCGLenum dstAlpha) = 0;

    virtual GCGLenum checkFramebufferStatus(GCGLenum target) = 0;
    virtual void clear(GCGLbitfield mask) = 0;
    virtual void clearColor(GCGLclampf red, GCGLclampf green, GCGLclampf blue, GCGLclampf alpha) = 0;
    virtual void clearDepth(GCGLclampf depth) = 0;
    virtual void clearStencil(GCGLint s) = 0;
    virtual void colorMask(GCGLboolean red, GCGLboolean green, GCGLboolean blue, GCGLboolean alpha) = 0;
    virtual void compileShader(PlatformGLObject) = 0;

    virtual void copyTexImage2D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLint x, GCGLint y, GCGLsizei width, GCGLsizei height, GCGLint border) = 0;
    virtual void copyTexSubImage2D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLint x, GCGLint y, GCGLsizei width, GCGLsizei height) = 0;

    virtual PlatformGLObject createBuffer() = 0;
    virtual PlatformGLObject createFramebuffer() = 0;
    virtual PlatformGLObject createProgram() = 0;
    virtual PlatformGLObject createRenderbuffer() = 0;
    virtual PlatformGLObject createShader(GCGLenum) = 0;
    virtual PlatformGLObject createTexture() = 0;

    virtual void cullFace(GCGLenum mode) = 0;

    virtual void deleteBuffer(PlatformGLObject) = 0;
    virtual void deleteFramebuffer(PlatformGLObject) = 0;
    virtual void deleteProgram(PlatformGLObject) = 0;
    virtual void deleteRenderbuffer(PlatformGLObject) = 0;
    virtual void deleteShader(PlatformGLObject) = 0;
    virtual void deleteTexture(PlatformGLObject) = 0;

    virtual void depthFunc(GCGLenum func) = 0;
    virtual void depthMask(GCGLboolean flag) = 0;
    virtual void depthRange(GCGLclampf zNear, GCGLclampf zFar) = 0;
    virtual void detachShader(PlatformGLObject, PlatformGLObject) = 0;
    virtual void disable(GCGLenum cap) = 0;
    virtual void disableVertexAttribArray(GCGLuint index) = 0;
    virtual void drawArrays(GCGLenum mode, GCGLint first, GCGLsizei count) = 0;
    virtual void drawElements(GCGLenum mode, GCGLsizei count, GCGLenum type, GCGLintptr offset) = 0;

    virtual void enable(GCGLenum cap) = 0;
    virtual void enableVertexAttribArray(GCGLuint index) = 0;
    virtual void finish() = 0;
    virtual void flush() = 0;
    virtual void framebufferRenderbuffer(GCGLenum target, GCGLenum attachment, GCGLenum renderbuffertarget, PlatformGLObject) = 0;
    virtual void framebufferTexture2D(GCGLenum target, GCGLenum attachment, GCGLenum textarget, PlatformGLObject, GCGLint level) = 0;
    virtual void frontFace(GCGLenum mode) = 0;

    virtual void generateMipmap(GCGLenum target) = 0;

    virtual bool getActiveAttrib(PlatformGLObject program, GCGLuint index, GraphicsContextGLActiveInfo&) = 0;
    virtual bool getActiveUniform(PlatformGLObject program, GCGLuint index, GraphicsContextGLActiveInfo&) = 0;

    virtual GCGLint getAttribLocation(PlatformGLObject, const String& name) = 0;

    virtual GCGLint getBufferParameteri(GCGLenum target, GCGLenum pname) = 0;

    // getParameter
    virtual String getString(GCGLenum name) = 0;
    virtual void getFloatv(GCGLenum pname, std::span<GCGLfloat> value) = 0;
    virtual void getIntegerv(GCGLenum pname, std::span<GCGLint> value) = 0;
    virtual void getIntegeri_v(GCGLenum pname, GCGLuint index, std::span<GCGLint, 4> value) = 0; // NOLINT
    virtual GCGLint64 getInteger64(GCGLenum pname) = 0;
    virtual GCGLint64 getInteger64i(GCGLenum pname, GCGLuint index) = 0;
    virtual GCGLint getProgrami(PlatformGLObject program, GCGLenum pname) = 0;
    virtual void getBooleanv(GCGLenum pname, std::span<GCGLboolean> value) = 0;

    virtual GCGLErrorCodeSet getErrors() = 0;

    // getFramebufferAttachmentParameter
    virtual GCGLint getFramebufferAttachmentParameteri(GCGLenum target, GCGLenum attachment, GCGLenum pname) = 0;

    // getProgramParameter
    virtual String getProgramInfoLog(PlatformGLObject) = 0;

    // getRenderbufferParameter
    virtual GCGLint getRenderbufferParameteri(GCGLenum target, GCGLenum pname) = 0;

    // getShaderParameter
    virtual GCGLint getShaderi(PlatformGLObject, GCGLenum pname) = 0;

    virtual String getShaderInfoLog(PlatformGLObject) = 0;
    virtual void getShaderPrecisionFormat(GCGLenum shaderType, GCGLenum precisionType, std::span<GCGLint, 2> range, GCGLint* precision) = 0;

    virtual String getShaderSource(PlatformGLObject) = 0;

    // getTexParameter
    virtual GCGLfloat getTexParameterf(GCGLenum target, GCGLenum pname) = 0;
    virtual GCGLint getTexParameteri(GCGLenum target, GCGLenum pname) = 0;

    // getUniform
    virtual void getUniformfv(PlatformGLObject program, GCGLint location, std::span<GCGLfloat> value) = 0;
    virtual void getUniformiv(PlatformGLObject program, GCGLint location, std::span<GCGLint> value) = 0;
    virtual void getUniformuiv(PlatformGLObject program, GCGLint location, std::span<GCGLuint> value) = 0;

    virtual GCGLint getUniformLocation(PlatformGLObject, const String& name) = 0;

    virtual GCGLsizeiptr getVertexAttribOffset(GCGLuint index, GCGLenum pname) = 0;

    virtual void hint(GCGLenum target, GCGLenum mode) = 0;
    virtual GCGLboolean isBuffer(PlatformGLObject) = 0;
    virtual GCGLboolean isEnabled(GCGLenum cap) = 0;
    virtual GCGLboolean isFramebuffer(PlatformGLObject) = 0;
    virtual GCGLboolean isProgram(PlatformGLObject) = 0;
    virtual GCGLboolean isRenderbuffer(PlatformGLObject) = 0;
    virtual GCGLboolean isShader(PlatformGLObject) = 0;
    virtual GCGLboolean isTexture(PlatformGLObject) = 0;
    virtual void lineWidth(GCGLfloat) = 0;
    virtual void linkProgram(PlatformGLObject) = 0;
    virtual void pixelStorei(GCGLenum pname, GCGLint param) = 0;
    virtual void polygonOffset(GCGLfloat factor, GCGLfloat units) = 0;

    virtual void renderbufferStorage(GCGLenum target, GCGLenum internalformat, GCGLsizei width, GCGLsizei height) = 0;
    virtual void sampleCoverage(GCGLclampf value, GCGLboolean invert) = 0;
    virtual void scissor(GCGLint x, GCGLint y, GCGLsizei width, GCGLsizei height) = 0;

    virtual void shaderSource(PlatformGLObject, const String& string) = 0;

    virtual void stencilFunc(GCGLenum func, GCGLint ref, GCGLuint mask) = 0;
    virtual void stencilFuncSeparate(GCGLenum face, GCGLenum func, GCGLint ref, GCGLuint mask) = 0;
    virtual void stencilMask(GCGLuint mask) = 0;
    virtual void stencilMaskSeparate(GCGLenum face, GCGLuint mask) = 0;
    virtual void stencilOp(GCGLenum fail, GCGLenum zfail, GCGLenum zpass) = 0;
    virtual void stencilOpSeparate(GCGLenum face, GCGLenum fail, GCGLenum zfail, GCGLenum zpass) = 0;

    virtual void texParameterf(GCGLenum target, GCGLenum pname, GCGLfloat param) = 0;
    virtual void texParameteri(GCGLenum target, GCGLenum pname, GCGLint param) = 0;

    virtual void uniform1f(GCGLint location, GCGLfloat x) = 0;
    virtual void uniform1fv(GCGLint location, std::span<const GCGLfloat> v) = 0;
    virtual void uniform1i(GCGLint location, GCGLint x) = 0;
    virtual void uniform1iv(GCGLint location, std::span<const GCGLint> v) = 0;
    virtual void uniform2f(GCGLint location, GCGLfloat x, GCGLfloat y) = 0;
    virtual void uniform2fv(GCGLint location, std::span<const GCGLfloat> v) = 0;
    virtual void uniform2i(GCGLint location, GCGLint x, GCGLint y) = 0;
    virtual void uniform2iv(GCGLint location, std::span<const GCGLint> v) = 0;
    virtual void uniform3f(GCGLint location, GCGLfloat x, GCGLfloat y, GCGLfloat z) = 0;
    virtual void uniform3fv(GCGLint location, std::span<const GCGLfloat> v) = 0;
    virtual void uniform3i(GCGLint location, GCGLint x, GCGLint y, GCGLint z) = 0;
    virtual void uniform3iv(GCGLint location, std::span<const GCGLint> v) = 0;
    virtual void uniform4f(GCGLint location, GCGLfloat x, GCGLfloat y, GCGLfloat z, GCGLfloat w) = 0;
    virtual void uniform4fv(GCGLint location, std::span<const GCGLfloat> v) = 0;
    virtual void uniform4i(GCGLint location, GCGLint x, GCGLint y, GCGLint z, GCGLint w) = 0;
    virtual void uniform4iv(GCGLint location, std::span<const GCGLint> v) = 0;
    virtual void uniformMatrix2fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> value) = 0;
    virtual void uniformMatrix3fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> value) = 0;
    virtual void uniformMatrix4fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> value) = 0;

    virtual void useProgram(PlatformGLObject) = 0;
    virtual void validateProgram(PlatformGLObject) = 0;

    virtual void vertexAttrib1f(GCGLuint index, GCGLfloat x) = 0;
    virtual void vertexAttrib1fv(GCGLuint index, std::span<const GCGLfloat, 1> values) = 0;
    virtual void vertexAttrib2f(GCGLuint index, GCGLfloat x, GCGLfloat y) = 0;
    virtual void vertexAttrib2fv(GCGLuint index, std::span<const GCGLfloat, 2> values) = 0;
    virtual void vertexAttrib3f(GCGLuint index, GCGLfloat x, GCGLfloat y, GCGLfloat z) = 0;
    virtual void vertexAttrib3fv(GCGLuint index, std::span<const GCGLfloat, 3> values) = 0;
    virtual void vertexAttrib4f(GCGLuint index, GCGLfloat x, GCGLfloat y, GCGLfloat z, GCGLfloat w) = 0;
    virtual void vertexAttrib4fv(GCGLuint index, std::span<const GCGLfloat, 4> values) = 0;

    virtual void vertexAttribPointer(GCGLuint index, GCGLint size, GCGLenum type, GCGLboolean normalized, GCGLsizei stride, GCGLintptr offset) = 0;

    virtual void viewport(GCGLint x, GCGLint y, GCGLsizei width, GCGLsizei height) = 0;

    virtual void bufferData(GCGLenum target, GCGLsizeiptr, GCGLenum usage) = 0;
    virtual void bufferData(GCGLenum target, std::span<const uint8_t> data, GCGLenum usage) = 0;
    virtual void bufferSubData(GCGLenum target, GCGLintptr offset, std::span<const uint8_t> data) = 0;

    virtual void readPixels(IntRect, GCGLenum format, GCGLenum type, std::span<uint8_t> data, GCGLint packAlignment, GCGLint packRowLength, GCGLboolean packReverseRowOrder) = 0;
    virtual void readPixelsBufferObject(IntRect, GCGLenum format, GCGLenum type, GCGLintptr offset, GCGLint alignment, GCGLint rowLength) = 0;

    virtual void texImage2D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLint border, GCGLenum format, GCGLenum type,  std::span<const uint8_t> pixels) = 0;
    virtual void texImage2D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLint border, GCGLenum format, GCGLenum type, GCGLintptr offset) = 0;
    virtual void texSubImage2D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLsizei width, GCGLsizei height, GCGLenum format, GCGLenum type, std::span<const uint8_t> pixels) = 0;
    virtual void texSubImage2D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLsizei width, GCGLsizei height, GCGLenum format, GCGLenum type, GCGLintptr offset) = 0;
    virtual void compressedTexImage2D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLint border, GCGLsizei imageSize, std::span<const uint8_t> data) = 0;
    virtual void compressedTexImage2D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLint border, GCGLsizei imageSize, GCGLintptr offset) = 0;
    virtual void compressedTexSubImage2D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLsizei width, GCGLsizei height, GCGLenum format, GCGLsizei imageSize, std::span<const uint8_t> data) = 0;
    virtual void compressedTexSubImage2D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLsizei width, GCGLsizei height, GCGLenum format, GCGLsizei imageSize, GCGLintptr offset) = 0;

    virtual void drawArraysInstanced(GCGLenum mode, GCGLint first, GCGLsizei count, GCGLsizei primcount) = 0;
    virtual void drawElementsInstanced(GCGLenum mode, GCGLsizei count, GCGLenum type, GCGLintptr offset, GCGLsizei primcount) = 0;
    virtual void vertexAttribDivisor(GCGLuint index, GCGLuint divisor) = 0;

    // VertexArrayOject calls
    virtual PlatformGLObject createVertexArray() = 0;
    virtual void deleteVertexArray(PlatformGLObject) = 0;
    virtual GCGLboolean isVertexArray(PlatformGLObject) = 0;
    virtual void bindVertexArray(PlatformGLObject) = 0;

    // ========== WebGL 2 entry points.

    virtual void copyBufferSubData(GCGLenum readTarget, GCGLenum writeTarget, GCGLintptr readOffset, GCGLintptr writeOffset, GCGLsizeiptr size) = 0;
    virtual void getBufferSubData(GCGLenum target, GCGLintptr offset, std::span<uint8_t> data) = 0;

    virtual void blitFramebuffer(GCGLint srcX0, GCGLint srcY0, GCGLint srcX1, GCGLint srcY1, GCGLint dstX0, GCGLint dstY0, GCGLint dstX1, GCGLint dstY1, GCGLbitfield mask, GCGLenum filter) = 0;
    virtual void framebufferTextureLayer(GCGLenum target, GCGLenum attachment, PlatformGLObject texture, GCGLint level, GCGLint layer) = 0;
    virtual void invalidateFramebuffer(GCGLenum target, std::span<const GCGLenum> attachments) = 0;
    virtual void invalidateSubFramebuffer(GCGLenum target, std::span<const GCGLenum> attachments, GCGLint x, GCGLint y, GCGLsizei width, GCGLsizei height) = 0;
    virtual void readBuffer(GCGLenum src) = 0;

    // getInternalFormatParameter
    virtual void getInternalformativ(GCGLenum target, GCGLenum internalformat, GCGLenum pname, std::span<GCGLint> data) = 0;
    virtual void renderbufferStorageMultisample(GCGLenum target, GCGLsizei samples, GCGLenum internalformat, GCGLsizei width, GCGLsizei height) = 0;

    virtual void texStorage2D(GCGLenum target, GCGLsizei levels, GCGLenum internalformat, GCGLsizei width, GCGLsizei height) = 0;
    virtual void texStorage3D(GCGLenum target, GCGLsizei levels, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLsizei depth) = 0;

    virtual void texImage3D(GCGLenum target, GCGLint level, GCGLint internalformat, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLint border, GCGLenum format, GCGLenum type, std::span<const uint8_t> pixels) = 0;
    virtual void texImage3D(GCGLenum target, GCGLint level, GCGLint internalformat, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLint border, GCGLenum format, GCGLenum type, GCGLintptr offset) = 0;
    virtual void texSubImage3D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLint zoffset, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLenum format, GCGLenum type, std::span<const uint8_t> pixels) = 0;
    virtual void texSubImage3D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLint zoffset, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLenum format, GCGLenum type, GCGLintptr offset) = 0;
    virtual void copyTexSubImage3D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLint zoffset, GCGLint x, GCGLint y, GCGLsizei width, GCGLsizei height) = 0;
    virtual void compressedTexImage3D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLint border, GCGLsizei imageSize, std::span<const uint8_t> data) = 0;
    virtual void compressedTexImage3D(GCGLenum target, GCGLint level, GCGLenum internalformat, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLint border, GCGLsizei imageSize, GCGLintptr offset) = 0;
    virtual void compressedTexSubImage3D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLint zoffset, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLenum format, GCGLsizei imageSize, std::span<const uint8_t> data) = 0;
    virtual void compressedTexSubImage3D(GCGLenum target, GCGLint level, GCGLint xoffset, GCGLint yoffset, GCGLint zoffset, GCGLsizei width, GCGLsizei height, GCGLsizei depth, GCGLenum format, GCGLsizei imageSize, GCGLintptr offset) = 0;

    virtual GCGLint getFragDataLocation(PlatformGLObject program, const String& name) = 0;

    virtual void uniform1ui(GCGLint location, GCGLuint v0) = 0;
    virtual void uniform2ui(GCGLint location, GCGLuint v0, GCGLuint v1) = 0;
    virtual void uniform3ui(GCGLint location, GCGLuint v0, GCGLuint v1, GCGLuint v2) = 0;
    virtual void uniform4ui(GCGLint location, GCGLuint v0, GCGLuint v1, GCGLuint v2, GCGLuint v3) = 0;
    virtual void uniform1uiv(GCGLint location, std::span<const GCGLuint> data) = 0;
    virtual void uniform2uiv(GCGLint location, std::span<const GCGLuint> data) = 0;
    virtual void uniform3uiv(GCGLint location, std::span<const GCGLuint> data) = 0;
    virtual void uniform4uiv(GCGLint location, std::span<const GCGLuint> data) = 0;
    virtual void uniformMatrix2x3fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> data) = 0;
    virtual void uniformMatrix3x2fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> data) = 0;
    virtual void uniformMatrix2x4fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> data) = 0;
    virtual void uniformMatrix4x2fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> data) = 0;
    virtual void uniformMatrix3x4fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> data) = 0;
    virtual void uniformMatrix4x3fv(GCGLint location, GCGLboolean transpose, std::span<const GCGLfloat> data) = 0;
    virtual void vertexAttribI4i(GCGLuint index, GCGLint x, GCGLint y, GCGLint z, GCGLint w) = 0;
    virtual void vertexAttribI4iv(GCGLuint index, std::span<const GCGLint, 4> values) = 0;
    virtual void vertexAttribI4ui(GCGLuint index, GCGLuint x, GCGLuint y, GCGLuint z, GCGLuint w) = 0;
    virtual void vertexAttribI4uiv(GCGLuint index, std::span<const GCGLuint, 4> values) = 0;
    virtual void vertexAttribIPointer(GCGLuint index, GCGLint size, GCGLenum type, GCGLsizei stride, GCGLintptr offset) = 0;

    virtual void drawRangeElements(GCGLenum mode, GCGLuint start, GCGLuint end, GCGLsizei count, GCGLenum type, GCGLintptr offset) = 0;

    virtual void drawBuffers(std::span<const GCGLenum> bufs) = 0;
    virtual void clearBufferiv(GCGLenum buffer, GCGLint drawbuffer, std::span<const GCGLint> values) = 0;
    virtual void clearBufferuiv(GCGLenum buffer, GCGLint drawbuffer, std::span<const GCGLuint> values) = 0;
    virtual void clearBufferfv(GCGLenum buffer, GCGLint drawbuffer, std::span<const GCGLfloat> values) = 0;
    virtual void clearBufferfi(GCGLenum buffer, GCGLint drawbuffer, GCGLfloat depth, GCGLint stencil) = 0;

    virtual PlatformGLObject createQuery() = 0;
    virtual void deleteQuery(PlatformGLObject query) = 0;
    virtual GCGLboolean isQuery(PlatformGLObject query) = 0;
    virtual void beginQuery(GCGLenum target, PlatformGLObject query) = 0;
    virtual void endQuery(GCGLenum target) = 0;
    virtual GCGLint getQuery(GCGLenum target, GCGLenum pname) = 0;
    // getQueryParameter
    virtual GCGLuint getQueryObjectui(PlatformGLObject query, GCGLenum pname) = 0;

    virtual PlatformGLObject createSampler() = 0;
    virtual void deleteSampler(PlatformGLObject sampler) = 0;
    virtual GCGLboolean isSampler(PlatformGLObject sampler) = 0;
    virtual void bindSampler(GCGLuint unit, PlatformGLObject sampler) = 0;
    virtual void samplerParameteri(PlatformGLObject sampler, GCGLenum pname, GCGLint param) = 0;
    virtual void samplerParameterf(PlatformGLObject sampler, GCGLenum pname, GCGLfloat param) = 0;
    // getSamplerParameter
    virtual GCGLfloat getSamplerParameterf(PlatformGLObject sampler, GCGLenum pname) = 0;
    virtual GCGLint getSamplerParameteri(PlatformGLObject sampler, GCGLenum pname) = 0;

    virtual GCGLsync fenceSync(GCGLenum condition, GCGLbitfield flags) = 0;
    virtual GCGLboolean isSync(GCGLsync) = 0;
    virtual void deleteSync(GCGLsync) = 0;
    virtual GCGLenum clientWaitSync(GCGLsync, GCGLbitfield flags, GCGLuint64 timeout) = 0;
    virtual void waitSync(GCGLsync, GCGLbitfield flags, GCGLint64 timeout) = 0;
    // getSyncParameter
    virtual GCGLint getSynci(GCGLsync, GCGLenum pname) = 0;

    virtual PlatformGLObject createTransformFeedback() = 0;
    virtual void deleteTransformFeedback(PlatformGLObject id) = 0;
    virtual GCGLboolean isTransformFeedback(PlatformGLObject id) = 0;
    virtual void bindTransformFeedback(GCGLenum target, PlatformGLObject id) = 0;
    virtual void beginTransformFeedback(GCGLenum primitiveMode) = 0;
    virtual void endTransformFeedback() = 0;
    virtual void transformFeedbackVaryings(PlatformGLObject program, const Vector<String>& varyings, GCGLenum bufferMode) = 0;
    virtual void getTransformFeedbackVarying(PlatformGLObject program, GCGLuint index, GraphicsContextGLActiveInfo&) = 0;
    virtual void pauseTransformFeedback() = 0;
    virtual void resumeTransformFeedback() = 0;

    virtual void bindBufferBase(GCGLenum target, GCGLuint index, PlatformGLObject buffer) = 0;
    virtual void bindBufferRange(GCGLenum target, GCGLuint index, PlatformGLObject buffer, GCGLintptr offset, GCGLsizeiptr size) = 0;
    // getIndexedParameter -> use getParameter calls above.
    virtual Vector<GCGLuint> getUniformIndices(PlatformGLObject program, const Vector<String>& uniformNames) = 0;
    virtual Vector<GCGLint> getActiveUniforms(PlatformGLObject program, const Vector<GCGLuint>& uniformIndices, GCGLenum pname) = 0;

    virtual GCGLuint getUniformBlockIndex(PlatformGLObject program, const String& uniformBlockName) = 0;
    // getActiveUniformBlockParameter
    virtual String getActiveUniformBlockName(PlatformGLObject program, GCGLuint uniformBlockIndex) = 0;
    virtual void uniformBlockBinding(PlatformGLObject program, GCGLuint uniformBlockIndex, GCGLuint uniformBlockBinding) = 0;

    virtual void getActiveUniformBlockiv(PlatformGLObject program, GCGLuint uniformBlockIndex, GCGLenum pname, std::span<GCGLint> params) = 0;

    // ========== EGL related entry points.

#if PLATFORM(COCOA)
    using EGLImageSourceIOSurfaceHandle = GraphicsContextGLExternalImageSourceIOSurfaceHandle;
    using EGLImageSourceMTLSharedTextureHandle = GraphicsContextGLExternalImageSourceMTLSharedTextureHandle;
#endif
#if ENABLE(WEBXR)
    virtual bool addFoveation(IntSize, IntSize, IntSize, std::span<const GCGLfloat>, std::span<const GCGLfloat>, std::span<const GCGLfloat>) = 0;
    virtual void enableFoveation(GCGLuint) = 0;
    virtual void disableFoveation() = 0;
#endif

    using ExternalImageSource = GraphicsContextGLExternalImageSource;
#if ENABLE(WEBXR)
    virtual GCGLExternalImage createExternalImage(ExternalImageSource&&, GCGLenum internalFormat, GCGLint layer) = 0;
    virtual void deleteExternalImage(GCGLExternalImage) = 0;
    virtual void bindExternalImage(GCGLenum target, GCGLExternalImage) = 0;
#endif

    using ExternalSyncSource = GraphicsContextGLExternalSyncSource;
#if ENABLE(WEBXR)
    virtual GCGLExternalSync createExternalSync(ExternalSyncSource&&) = 0;
#endif
    virtual void deleteExternalSync(GCGLExternalSync) = 0;

    // ========== Extension related entry points.

    // GL_ANGLE_multi_draw
    virtual void multiDrawArraysANGLE(GCGLenum mode, GCGLSpanTuple<const GCGLint, const GCGLsizei> firstsAndCounts) = 0;
    virtual void multiDrawArraysInstancedANGLE(GCGLenum mode, GCGLSpanTuple<const GCGLint, const GCGLsizei, const GCGLsizei> firstsCountsAndInstanceCounts) = 0;
    virtual void multiDrawElementsANGLE(GCGLenum mode, GCGLSpanTuple<const GCGLsizei, const GCGLsizei> countsAndOffsets, GCGLenum type) = 0;
    virtual void multiDrawElementsInstancedANGLE(GCGLenum mode, GCGLSpanTuple<const GCGLsizei, const GCGLsizei, const GCGLsizei> countsOffsetsAndInstanceCounts, GCGLenum type) = 0;

    virtual bool supportsExtension(const String&) = 0;

    // This method may only be called with extension names for which supports returns true.
    virtual void ensureExtensionEnabled(const String&) = 0;

    // Takes full name of extension: for example, "GL_EXT_texture_format_BGRA8888".
    // Checks to see whether the given extension is actually enabled (see ensureExtensionEnabled).
    // Has no other side-effects.
    virtual bool isExtensionEnabled(const String&) = 0;

#if ENABLE(WEBXR)
    virtual bool enableRequiredWebXRExtensions() { return false; }
#endif

    // GL_ANGLE_translated_shader_source
    virtual String getTranslatedShaderSourceANGLE(PlatformGLObject) = 0;

    // GL_ARB_draw_buffers / GL_EXT_draw_buffers
    virtual void drawBuffersEXT(std::span<const GCGLenum> bufs) = 0;

    // GL_EXT_disjoint_timer_query
    virtual PlatformGLObject createQueryEXT() = 0;
    virtual void deleteQueryEXT(PlatformGLObject query) = 0;
    virtual GCGLboolean isQueryEXT(PlatformGLObject query) = 0;
    virtual void beginQueryEXT(GCGLenum target, PlatformGLObject query) = 0;
    virtual void endQueryEXT(GCGLenum target) = 0;
    virtual void queryCounterEXT(PlatformGLObject query, GCGLenum target) = 0;
    virtual GCGLint getQueryiEXT(GCGLenum target, GCGLenum pname) = 0;
    virtual GCGLint getQueryObjectiEXT(PlatformGLObject query, GCGLenum pname) = 0;
    virtual GCGLuint64 getQueryObjectui64EXT(PlatformGLObject query, GCGLenum pname) = 0;
    virtual GCGLint64 getInteger64EXT(GCGLenum pname) = 0;

    // GL_OES_draw_buffers_indexed
    virtual void enableiOES(GCGLenum target, GCGLuint index) = 0;
    virtual void disableiOES(GCGLenum target, GCGLuint index) = 0;
    virtual void blendEquationiOES(GCGLuint buf, GCGLenum mode) = 0;
    virtual void blendEquationSeparateiOES(GCGLuint buf, GCGLenum modeRGB, GCGLenum modeAlpha) = 0;
    virtual void blendFunciOES(GCGLuint buf, GCGLenum src, GCGLenum dst) = 0;
    virtual void blendFuncSeparateiOES(GCGLuint buf, GCGLenum srcRGB, GCGLenum dstRGB, GCGLenum srcAlpha, GCGLenum dstAlpha) = 0;
    virtual void colorMaskiOES(GCGLuint buf, GCGLboolean red, GCGLboolean green, GCGLboolean blue, GCGLboolean alpha) = 0;

    // GL_ANGLE_base_vertex_base_instance
    virtual void drawArraysInstancedBaseInstanceANGLE(GCGLenum mode, GCGLint first, GCGLsizei count, GCGLsizei instanceCount, GCGLuint baseInstance) = 0;
    virtual void drawElementsInstancedBaseVertexBaseInstanceANGLE(GCGLenum mode, GCGLsizei count, GCGLenum type, GCGLintptr offset, GCGLsizei instanceCount, GCGLint baseVertex, GCGLuint baseInstance) = 0;
    virtual void multiDrawArraysInstancedBaseInstanceANGLE(GCGLenum mode, GCGLSpanTuple<const GCGLint, const GCGLsizei, const GCGLsizei, const GCGLuint> firstsCountsInstanceCountsAndBaseInstances) = 0;
    virtual void multiDrawElementsInstancedBaseVertexBaseInstanceANGLE(GCGLenum mode, GCGLSpanTuple<const GCGLsizei, const GCGLsizei, const GCGLsizei, const GCGLint, const GCGLuint> countsOffsetsInstanceCountsBaseVerticesAndBaseInstances, GCGLenum type) = 0;

    // GL_EXT_clip_control
    virtual void clipControlEXT(GCGLenum origin, GCGLenum depth) = 0;

    // GL_ANGLE_provoking_vertex
    virtual void provokingVertexANGLE(GCGLenum provokeMode) = 0;

    // GL_ANGLE_polygon_mode
    virtual void polygonModeANGLE(GCGLenum face, GCGLenum mode) = 0;

    // GL_EXT_polygon_offset_clamp
    virtual void polygonOffsetClampEXT(GCGLfloat factor, GCGLfloat units, GCGLfloat clamp) = 0;

    // GL_EXT_discard_framebuffer
    WEBCORE_EXPORT virtual void framebufferDiscard(GCGLenum, std::span<const GCGLenum>);

    // ========== Internal use for WebXR on WebGL1 contexts.
    virtual void renderbufferStorageMultisampleANGLE(GCGLenum target, GCGLsizei samples, GCGLenum internalformat, GCGLsizei width, GCGLsizei height) = 0;
#if ENABLE(WEBXR)
    WEBCORE_EXPORT virtual void framebufferResolveRenderbuffer(GCGLenum target, GCGLenum attachment, GCGLenum renderbuffertarget, PlatformGLObject);
#endif

    // ========== Other functions.
    GCGLfloat getFloat(GCGLenum pname);
    GCGLboolean getBoolean(GCGLenum pname);
    GCGLint getInteger(GCGLenum pname);
    GCGLint getIntegeri(GCGLenum pname, GCGLuint index);
    GCGLint getActiveUniformBlocki(PlatformGLObject program, GCGLuint uniformBlockIndex, GCGLenum pname);
    GCGLint getInternalformati(GCGLenum target, GCGLenum internalformat, GCGLenum pname);

    GraphicsContextGLAttributes contextAttributes() const { return m_attrs; }
    void setContextAttributes(const GraphicsContextGLAttributes& attrs) { m_attrs = attrs; }

    virtual std::tuple<GCGLenum, GCGLenum> externalImageTextureBindingPoint();

    virtual void reshape(int width, int height) = 0;

    WEBCORE_EXPORT virtual void setDrawingBufferColorSpace(const DestinationColorSpace&);

    virtual void prepareForDisplay() = 0;

    // FIXME: these should be removed, they're part of drawing buffer and
    // display buffer abstractions that the caller should hold separate to
    // the context.
    using SurfaceBuffer = GraphicsContextGLSurfaceBuffer;
    virtual void drawSurfaceBufferToImageBuffer(SurfaceBuffer, ImageBuffer&) = 0;
#if ENABLE(MEDIA_STREAM) || ENABLE(WEB_CODECS)
    virtual RefPtr<VideoFrame> surfaceBufferToVideoFrame(SurfaceBuffer) = 0;
#endif

    using SimulatedEventForTesting = GraphicsContextGLSimulatedEventForTesting;
    virtual void simulateEventForTesting(SimulatedEventForTesting) = 0;

#if ENABLE(VIDEO)
    virtual bool copyTextureFromVideoFrame(VideoFrame&, PlatformGLObject texture, GCGLenum target, GCGLint level, GCGLenum internalFormat, GCGLenum  format, GCGLenum type, bool premultiplyAlpha, bool flipY) = 0;
    WEBCORE_EXPORT virtual RefPtr<Image> videoFrameToImage(VideoFrame&);
#endif

    IntSize getInternalFramebufferSize() const { return IntSize(m_currentWidth, m_currentHeight); }

    struct PixelStoreParameters final {
        GCGLint alignment { 4 };
        GCGLint rowLength { 0 };
        GCGLint imageHeight { 0 };
        GCGLint skipPixels { 0 };
        GCGLint skipRows { 0 };
        GCGLint skipImages { 0 };
    };

    // Computes the bytes per image element for a format and type.
    // Returns zero if format or type is an invalid enum.
    WEBCORE_EXPORT static unsigned computeBytesPerGroup(GCGLenum format, GCGLenum type);


    struct PixelRectangleSizes {
        unsigned initialSkipBytes { 0 };
        unsigned imageBytes { 0 }; // Size for the tightly packed image, does not include initial skip, alignment, row length skip.
        unsigned alignedRowBytes { 0 }; // Row bytes including alignment, image, row length skips (rows 0..height-2)
        unsigned lastRowBytes { 0 }; // Row bytes of the last row, i.e. of the tightly packed image (last row, height - 1).
    };
    // Returns nullopt if width/height is negative or overflow happens or if format and type are invalid.
    // Also validates total bytes (imageBytes + initialSkipBytes)
    static std::optional<PixelRectangleSizes> computeImageSize(GCGLenum format, GCGLenum type, IntSize, GCGLsizei depth, const PixelStoreParameters&);

    // Extracts the contents of the given PixelBuffer into the passed Vector,
    // packing the pixel data according to the given format and type,
    // and obeying the flipY and premultiplyAlpha flags. Returns true
    // upon success.
    static bool extractPixelBuffer(const PixelBuffer&, DataFormat, const IntRect& sourceImageSubRectangle, int depth, int unpackImageHeight, GCGLenum format, GCGLenum type, bool flipY, bool premultiplyAlpha, Vector<uint8_t>& data);

    // Helper function which extracts the user-supplied texture
    // data, applying the flipY and premultiplyAlpha parameters.
    // If the data is not tightly packed according to the passed
    // unpackParams, the output data will be tightly packed.
    // Returns true if successful, false if any error occurred.
    static bool extractTextureData(unsigned width, unsigned height, GCGLenum format, GCGLenum type, const PixelStoreParameters& unpackParams, bool flipY, bool premultiplyAlpha, std::span<const uint8_t> pixels, Vector<uint8_t>& data);

    // Packs the contents of the given Image which is passed in |pixels| into the passed Vector
    // according to the given format and type, and obeying the flipY and AlphaOp flags.
    // Returns true upon success.
    static bool packImageData(Image*, const void* pixels, GCGLenum format, GCGLenum type, bool flipY, AlphaOp, DataFormat sourceFormat, unsigned sourceImageWidth, unsigned sourceImageHeight, const IntRect& sourceImageSubRectangle, int depth, unsigned sourceUnpackAlignment, int unpackImageHeight, Vector<uint8_t>& data);

    WEBCORE_EXPORT static RefPtr<NativeImage> createNativeImageFromPixelBuffer(const GraphicsContextGLAttributes&, Ref<PixelBuffer>&&);
    WEBCORE_EXPORT static void paintToCanvas(NativeImage&, const IntSize& canvasSize, GraphicsContext&);
    WEBCORE_EXPORT static void paintToCanvas(const GraphicsContextGLAttributes&, Ref<PixelBuffer>&&, const IntSize& canvasSize, GraphicsContext&);

    bool isContextLost() const { return m_contextLost; }
protected:
    WEBCORE_EXPORT virtual void forceContextLost();

    int m_currentWidth { 0 };
    int m_currentHeight { 0 };
    Client* m_client { nullptr };
    bool m_contextLost { false };

private:
    GraphicsContextGLAttributes m_attrs;
};

WEBCORE_EXPORT RefPtr<GraphicsContextGL> createWebProcessGraphicsContextGL(const GraphicsContextGLAttributes&);

template<typename Object, void(GraphicsContextGL::*destroyFunc)(Object)>
class GCGLOwned {
    WTF_MAKE_NONCOPYABLE(GCGLOwned);

public:
    GCGLOwned() = default;

    GCGLOwned(GCGLOwned&& other)
        : m_object(other.leakObject())
    {
    }

    ~GCGLOwned()
    {
        ASSERT(!m_object); // Clients should call release() explicitly.
    }

    operator Object() const { return m_object; }

    Object leakObject() { return std::exchange(m_object, { }); }

    void adopt(GraphicsContextGL& gl, Object object)
    {
        if (m_object)
            (gl.*destroyFunc)(m_object);
        m_object = object;
    }

    void release(GraphicsContextGL& gl) { adopt(gl, { }); }
private:
    Object m_object { };
};

using GCGLOwnedFramebuffer = GCGLOwned<PlatformGLObject, &GraphicsContextGL::deleteFramebuffer>;
using GCGLOwnedRenderbuffer = GCGLOwned<PlatformGLObject, &GraphicsContextGL::deleteRenderbuffer>;
using GCGLOwnedTexture = GCGLOwned<PlatformGLObject, &GraphicsContextGL::deleteTexture>;
#if ENABLE(WEBXR)
using GCGLOwnedExternalImage = GCGLOwned<GCGLExternalImage, &GraphicsContextGL::deleteExternalImage>;
#endif

} // namespace WebCore

#endif
