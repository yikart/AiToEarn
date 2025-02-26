/*
 * Copyright (C) 2009, 2013, 2016 Apple Inc. All rights reserved.
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
 *
 */

#pragma once

#include "Blob.h"
#include "DetachedRTCDataChannel.h"
#include "ExceptionOr.h"
#include <JavaScriptCore/ArrayBuffer.h>
#include <JavaScriptCore/JSCJSValue.h>
#include <JavaScriptCore/Strong.h>
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/Gigacage.h>
#include <wtf/text/WTFString.h>

#if ENABLE(MEDIA_STREAM)
#include "MediaStreamTrackDataHolder.h"
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
#include "MediaSourceHandle.h"
#endif

#if ENABLE(WEB_CODECS)
#include "WebCodecsAudioData.h"
#include "WebCodecsAudioInternalData.h"
#include "WebCodecsEncodedAudioChunk.h"
#include "WebCodecsEncodedVideoChunk.h"
#include "WebCodecsVideoFrame.h"
#endif

typedef const struct OpaqueJSContext* JSContextRef;
typedef const struct OpaqueJSValue* JSValueRef;

#if ENABLE(WEBASSEMBLY)
namespace JSC { namespace Wasm {
class Module;
class MemoryHandle;
} }
#endif

namespace JSC {
class ErrorInstance;
class JSGlobalObject;
}

namespace WebCore {

#if ENABLE(OFFSCREEN_CANVAS_IN_WORKERS)
class DetachedOffscreenCanvas;
class OffscreenCanvas;
#endif
class CryptoKey;
class IDBValue;
class MessagePort;
class DetachedImageBitmap;
class FragmentedSharedBuffer;
enum class SerializationReturnCode;

enum class SerializationErrorMode { NonThrowing, Throwing };
enum class SerializationContext { Default, WorkerPostMessage, WindowPostMessage, CloneAcrossWorlds };
enum class SerializationForStorage : bool { No, Yes };

using ArrayBufferContentsArray = Vector<JSC::ArrayBufferContents>;
#if ENABLE(WEBASSEMBLY)
using WasmModuleArray = Vector<RefPtr<JSC::Wasm::Module>>;
using WasmMemoryHandleArray = Vector<RefPtr<JSC::SharedArrayBufferContents>>;
#endif

struct ErrorInformation {
    String errorTypeString;
    String message;
    unsigned line { 0 };
    unsigned column { 0 };
    String sourceURL;
    String stack;
};

std::optional<ErrorInformation> extractErrorInformationFromErrorInstance(JSC::JSGlobalObject*, JSC::ErrorInstance&);

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(SerializedScriptValue);
class SerializedScriptValue : public ThreadSafeRefCounted<SerializedScriptValue> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(SerializedScriptValue);
public:
    WEBCORE_EXPORT static ExceptionOr<Ref<SerializedScriptValue>> create(JSC::JSGlobalObject&, JSC::JSValue, Vector<JSC::Strong<JSC::JSObject>>&& transfer, Vector<Ref<MessagePort>>&, SerializationForStorage = SerializationForStorage::No, SerializationContext = SerializationContext::Default);
    WEBCORE_EXPORT static RefPtr<SerializedScriptValue> create(JSC::JSGlobalObject&, JSC::JSValue, SerializationForStorage = SerializationForStorage::No, SerializationErrorMode = SerializationErrorMode::Throwing, SerializationContext = SerializationContext::Default);
    static RefPtr<SerializedScriptValue> convert(JSC::JSGlobalObject& globalObject, JSC::JSValue value) { return create(globalObject, value, SerializationForStorage::Yes); }

    WEBCORE_EXPORT static RefPtr<SerializedScriptValue> create(StringView);

    static Ref<SerializedScriptValue> nullValue();

    WEBCORE_EXPORT JSC::JSValue deserialize(JSC::JSGlobalObject&, JSC::JSGlobalObject*, SerializationErrorMode = SerializationErrorMode::Throwing, bool* didFail = nullptr);
    WEBCORE_EXPORT JSC::JSValue deserialize(JSC::JSGlobalObject&, JSC::JSGlobalObject*, const Vector<Ref<MessagePort>>&, SerializationErrorMode = SerializationErrorMode::Throwing, bool* didFail = nullptr);
    JSC::JSValue deserialize(JSC::JSGlobalObject&, JSC::JSGlobalObject*, const Vector<Ref<MessagePort>>&, const Vector<String>& blobURLs, const Vector<String>& blobFilePaths, SerializationErrorMode = SerializationErrorMode::Throwing, bool* didFail = nullptr);

    WEBCORE_EXPORT String toString() const;

    // API implementation helpers. These don't expose special behavior for ArrayBuffers or MessagePorts.
    WEBCORE_EXPORT static RefPtr<SerializedScriptValue> create(JSContextRef, JSValueRef, JSValueRef* exception);
    WEBCORE_EXPORT JSValueRef deserialize(JSContextRef, JSValueRef* exception);
    WEBCORE_EXPORT static Vector<uint8_t> serializeCryptoKey(JSContextRef, const WebCore::CryptoKey&);

    bool hasBlobURLs() const { return !m_internals.blobHandles.isEmpty(); }

    Vector<String> blobURLs() const;
    Vector<URLKeepingBlobAlive> blobHandles() const { return crossThreadCopy(m_internals.blobHandles); }
    void writeBlobsToDiskForIndexedDB(CompletionHandler<void(IDBValue&&)>&&);
    IDBValue writeBlobsToDiskForIndexedDBSynchronously();
    static Ref<SerializedScriptValue> createFromWireBytes(Vector<uint8_t>&& data)
    {
        return adoptRef(*new SerializedScriptValue(WTFMove(data)));
    }
    const Vector<uint8_t>& wireBytes() const { return m_internals.data; }

    size_t memoryCost() const { return m_internals.memoryCost; }

    WEBCORE_EXPORT ~SerializedScriptValue();

private:
    friend struct IPC::ArgumentCoder<SerializedScriptValue, void>;

    static ExceptionOr<Ref<SerializedScriptValue>> create(JSC::JSGlobalObject&, JSC::JSValue, Vector<JSC::Strong<JSC::JSObject>>&& transfer, Vector<Ref<MessagePort>>&, SerializationForStorage, SerializationErrorMode, SerializationContext);
    WEBCORE_EXPORT SerializedScriptValue(Vector<unsigned char>&&, std::unique_ptr<ArrayBufferContentsArray>&& = nullptr
#if ENABLE(WEB_RTC)
        , Vector<std::unique_ptr<DetachedRTCDataChannel>>&& = { }
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
        , Vector<RefPtr<DetachedMediaSourceHandle>>&& = { }
#endif
#if ENABLE(WEB_CODECS)
        , Vector<RefPtr<WebCodecsEncodedVideoChunkStorage>>&& = { }
        , Vector<WebCodecsVideoFrameData>&& = { }
        , Vector<RefPtr<WebCodecsEncodedAudioChunkStorage>>&& = { }
        , Vector<WebCodecsAudioInternalData>&& = { }
#endif
#if ENABLE(MEDIA_STREAM)
        , Vector<std::unique_ptr<MediaStreamTrackDataHolder>>&& = { }
#endif
        );

    SerializedScriptValue(Vector<unsigned char>&&, Vector<URLKeepingBlobAlive>&& blobHandles, std::unique_ptr<ArrayBufferContentsArray>, std::unique_ptr<ArrayBufferContentsArray> sharedBuffers, Vector<std::optional<DetachedImageBitmap>>&&
#if ENABLE(OFFSCREEN_CANVAS_IN_WORKERS)
        , Vector<std::unique_ptr<DetachedOffscreenCanvas>>&& = { }
        , Vector<RefPtr<OffscreenCanvas>>&& = { }
#endif
        , Vector<Ref<MessagePort>>&& = { }
#if ENABLE(WEB_RTC)
        , Vector<std::unique_ptr<DetachedRTCDataChannel>>&& = { }
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
        , Vector<RefPtr<DetachedMediaSourceHandle>>&& = { }
#endif
#if ENABLE(WEBASSEMBLY)
        , WasmModuleArray&& = { }
        , std::unique_ptr<WasmMemoryHandleArray> = nullptr
#endif
#if ENABLE(WEB_CODECS)
        , Vector<RefPtr<WebCodecsEncodedVideoChunkStorage>>&& = { }
        , Vector<WebCodecsVideoFrameData>&& = { }
        , Vector<RefPtr<WebCodecsEncodedAudioChunkStorage>>&& = { }
        , Vector<WebCodecsAudioInternalData>&& = { }
#endif
#if ENABLE(MEDIA_STREAM)
        , Vector<std::unique_ptr<MediaStreamTrackDataHolder>>&& = { }
#endif
        );

    size_t computeMemoryCost() const;

    struct Internals {
        Vector<unsigned char> data;
        std::unique_ptr<ArrayBufferContentsArray> arrayBufferContentsArray;
#if ENABLE(WEB_RTC)
        Vector<std::unique_ptr<DetachedRTCDataChannel>> detachedRTCDataChannels;
#endif
#if ENABLE(WEB_CODECS)
        Vector<RefPtr<WebCodecsEncodedVideoChunkStorage>> serializedVideoChunks;
        Vector<RefPtr<WebCodecsEncodedAudioChunkStorage>> serializedAudioChunks;
        Vector<WebCodecsVideoFrameData> serializedVideoFrames { };
        Vector<WebCodecsAudioInternalData> serializedAudioData { };
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
        Vector<RefPtr<DetachedMediaSourceHandle>> detachedMediaSourceHandles { };
#endif
#if ENABLE(MEDIA_STREAM)
        Vector<std::unique_ptr<MediaStreamTrackDataHolder>> serializedMediaStreamTracks { };
#endif
        std::unique_ptr<ArrayBufferContentsArray> sharedBufferContentsArray { };
        Vector<std::optional<DetachedImageBitmap>> detachedImageBitmaps { };
#if ENABLE(OFFSCREEN_CANVAS_IN_WORKERS)
        Vector<std::unique_ptr<DetachedOffscreenCanvas>> detachedOffscreenCanvases { };
        Vector<RefPtr<OffscreenCanvas>> inMemoryOffscreenCanvases { };
#endif
        Vector<Ref<MessagePort>> inMemoryMessagePorts { };
#if ENABLE(WEBASSEMBLY)
        std::unique_ptr<WasmModuleArray> wasmModulesArray { };
        std::unique_ptr<WasmMemoryHandleArray> wasmMemoryHandlesArray { };
#endif
        Vector<URLKeepingBlobAlive> blobHandles { };
        size_t memoryCost { 0 };
    };
    friend struct IPC::ArgumentCoder<Internals, void>;

    static Ref<SerializedScriptValue> create(Internals&& internals)
    {
        return adoptRef(*new SerializedScriptValue(WTFMove(internals)));
    }

    WEBCORE_EXPORT explicit SerializedScriptValue(Internals&&);

    Internals m_internals;
};

}
