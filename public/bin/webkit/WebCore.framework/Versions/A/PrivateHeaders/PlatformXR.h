/*
 * Copyright (C) 2020 Igalia, S.L.
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * aint with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */
#pragma once

#include "DestinationColorSpace.h"
#include "FloatPoint3D.h"
#include "GraphicsTypesGL.h"
#include "IntRect.h"
#include "IntSize.h"
#include <memory>
#include <variant>
#include <wtf/CompletionHandler.h>
#include <wtf/HashMap.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

#if PLATFORM(COCOA)
#include "IOSurface.h"
#include <wtf/MachSendRight.h>
#endif

namespace PlatformXR {
class TrackingAndRenderingClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<PlatformXR::TrackingAndRenderingClient> : std::true_type { };
}

namespace WebCore {
class SecurityOriginData;
}

namespace PlatformXR {

enum class Layout : uint8_t {
    Shared,
    Layered,
};

enum class SessionMode : uint8_t {
    Inline,
    ImmersiveVr,
    ImmersiveAr,
};

inline bool isImmersive(SessionMode mode)
{
    using enum PlatformXR::SessionMode;
    return mode == ImmersiveAr || mode == ImmersiveVr;
}

enum class ReferenceSpaceType : uint8_t {
    Viewer,
    Local,
    LocalFloor,
    BoundedFloor,
    Unbounded
};

enum class Eye {
    None,
    Left,
    Right,
};

enum class VisibilityState : uint8_t {
    Visible,
    VisibleBlurred,
    Hidden
};

using LayerHandle = int;

#if ENABLE(WEBXR)
using InputSourceHandle = int;

// https://immersive-web.github.io/webxr/#enumdef-xrhandedness
enum class XRHandedness : uint8_t {
    None,
    Left,
    Right,
};

// https://immersive-web.github.io/webxr/#enumdef-xrtargetraymode
enum class XRTargetRayMode : uint8_t {
    Gaze,
    TrackedPointer,
    Screen,
    TransientPointer,
};

// https://immersive-web.github.io/webxr/#feature-descriptor
enum class SessionFeature : uint8_t {
    ReferenceSpaceTypeViewer,
    ReferenceSpaceTypeLocal,
    ReferenceSpaceTypeLocalFloor,
    ReferenceSpaceTypeBoundedFloor,
    ReferenceSpaceTypeUnbounded,
#if ENABLE(WEBXR_HANDS)
    HandTracking,
#endif
};

inline SessionFeature sessionFeatureFromReferenceSpaceType(ReferenceSpaceType referenceSpaceType)
{
    switch (referenceSpaceType) {
    case ReferenceSpaceType::Viewer:
        return SessionFeature::ReferenceSpaceTypeViewer;
    case ReferenceSpaceType::Local:
        return SessionFeature::ReferenceSpaceTypeLocal;
    case ReferenceSpaceType::LocalFloor:
        return SessionFeature::ReferenceSpaceTypeLocalFloor;
    case ReferenceSpaceType::BoundedFloor:
        return SessionFeature::ReferenceSpaceTypeBoundedFloor;
    case ReferenceSpaceType::Unbounded:
        return SessionFeature::ReferenceSpaceTypeUnbounded;
    }

    ASSERT_NOT_REACHED();
    return SessionFeature::ReferenceSpaceTypeViewer;
}

inline std::optional<SessionFeature> parseSessionFeatureDescriptor(StringView string)
{
    auto feature = string.trim(isUnicodeCompatibleASCIIWhitespace<UChar>).convertToASCIILowercase();

    if (feature == "viewer"_s)
        return SessionFeature::ReferenceSpaceTypeViewer;
    if (feature == "local"_s)
        return SessionFeature::ReferenceSpaceTypeLocal;
    if (feature == "local-floor"_s)
        return SessionFeature::ReferenceSpaceTypeLocalFloor;
    if (feature == "bounded-floor"_s)
        return SessionFeature::ReferenceSpaceTypeBoundedFloor;
    if (feature == "unbounded"_s)
        return SessionFeature::ReferenceSpaceTypeUnbounded;
#if ENABLE(WEBXR_HANDS)
    if (feature == "hand-tracking"_s)
        return SessionFeature::HandTracking;
#endif

    return std::nullopt;
}

inline String sessionFeatureDescriptor(SessionFeature sessionFeature)
{
    switch (sessionFeature) {
    case SessionFeature::ReferenceSpaceTypeViewer:
        return "viewer"_s;
    case SessionFeature::ReferenceSpaceTypeLocal:
        return "local"_s;
    case SessionFeature::ReferenceSpaceTypeLocalFloor:
        return "local-floor"_s;
    case SessionFeature::ReferenceSpaceTypeBoundedFloor:
        return "bounded-floor"_s;
    case SessionFeature::ReferenceSpaceTypeUnbounded:
        return "unbounded"_s;
#if ENABLE(WEBXR_HANDS)
    case SessionFeature::HandTracking:
        return "hand-tracking"_s;
#endif
    default:
        ASSERT_NOT_REACHED();
        return ""_s;
    }
}

#if ENABLE(WEBXR_HANDS)

enum class HandJoint : unsigned {
    Wrist = 0,
    ThumbMetacarpal,
    ThumbPhalanxProximal,
    ThumbPhalanxDistal,
    ThumbTip,
    IndexFingerMetacarpal,
    IndexFingerPhalanxProximal,
    IndexFingerPhalanxIntermediate,
    IndexFingerPhalanxDistal,
    IndexFingerTip,
    MiddleFingerMetacarpal,
    MiddleFingerPhalanxProximal,
    MiddleFingerPhalanxIntermediate,
    MiddleFingerPhalanxDistal,
    MiddleFingerTip,
    RingFingerMetacarpal,
    RingFingerPhalanxProximal,
    RingFingerPhalanxIntermediate,
    RingFingerPhalanxDistal,
    RingFingerTip,
    PinkyFingerMetacarpal,
    PinkyFingerPhalanxProximal,
    PinkyFingerPhalanxIntermediate,
    PinkyFingerPhalanxDistal,
    PinkyFingerTip,
    Count
};

#endif

class TrackingAndRenderingClient;

struct DepthRange {
    float near { 0.1f };
    float far { 1000.0f };
};

struct RequestData {
    DepthRange depthRange;
};

struct FrameData {
    struct FloatQuaternion {
        float x { 0.0f };
        float y { 0.0f };
        float z { 0.0f };
        float w { 1.0f };
    };

    struct Pose {
        WebCore::FloatPoint3D position;
        FloatQuaternion orientation;
    };

    struct Fov {
        // In radians
        float up { 0.0f };
        float down { 0.0f };
        float left { 0.0f };
        float right { 0.0f };
    };

    static constexpr size_t projectionMatrixSize = 16;
    typedef std::array<float, projectionMatrixSize> ProjectionMatrix;

    using Projection = std::variant<Fov, ProjectionMatrix, std::nullptr_t>;

    struct View {
        Pose offset;
        Projection projection = { nullptr };
    };

    struct StageParameters {
        int id { 0 };
        Vector<WebCore::FloatPoint> bounds;
    };

#if PLATFORM(COCOA)
    struct RateMapDescription {
        WebCore::IntSize screenSize = { 0, 0 };
        Vector<float> horizontalSamplesLeft;
        Vector<float> horizontalSamplesRight;
        // Vertical samples is shared by both horizontalSamples
        Vector<float> verticalSamples;
    };

    static constexpr auto LayerSetupSizeMax = std::numeric_limits<uint16_t>::max();
    struct LayerSetupData {
        std::array<std::array<uint16_t, 2>, 2> physicalSize;
        std::array<WebCore::IntRect, 2> viewports;
        RateMapDescription foveationRateMapDesc;
        MachSendRight completionSyncEvent;
    };

    struct ExternalTexture {
        MachSendRight handle;
        bool isSharedTexture { false };
    };

    struct ExternalTextureData {
        size_t reusableTextureIndex = 0;
        ExternalTexture colorTexture;
        ExternalTexture depthStencilBuffer;
    };
#endif

    struct LayerData {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;
#if PLATFORM(COCOA)
        std::optional<LayerSetupData> layerSetup = { std::nullopt };
        uint64_t renderingFrameIndex { 0 };
        std::optional<ExternalTextureData> textureData;
        // FIXME: <rdar://134998122> Remove when new CC lands.
        bool requestDepth { false };
#else
        WebCore::IntSize framebufferSize;
        PlatformGLObject opaqueTexture { 0 };
#endif
    };

    struct InputSourceButton {
        bool touched { false };
        bool pressed { false };
        float pressedValue { 0 };
    };

    struct InputSourcePose {
        Pose pose;
        bool isPositionEmulated { false };
    };

#if ENABLE(WEBXR_HANDS)
    struct InputSourceHandJoint {
        InputSourcePose pose;
        float radius { 0 };
    };

    using HandJointsVector = Vector<std::optional<InputSourceHandJoint>>;
#endif

    struct InputSource {
        InputSourceHandle handle { 0 };
        XRHandedness handedness { XRHandedness::None };
        XRTargetRayMode targetRayMode { XRTargetRayMode::Gaze };
        Vector<String> profiles;
        InputSourcePose pointerOrigin;
        std::optional<InputSourcePose> gripOrigin;
        Vector<InputSourceButton> buttons;
        Vector<float> axes;
#if ENABLE(WEBXR_HANDS)
        std::optional<HandJointsVector> handJoints;
#endif
    };

    bool isTrackingValid { false };
    bool isPositionValid { false };
    bool isPositionEmulated { false };
    bool shouldRender { false };
    long predictedDisplayTime { 0 };
    Pose origin;
    std::optional<Pose> floorTransform;
    StageParameters stageParameters;
    Vector<View> views;
    HashMap<LayerHandle, UniqueRef<LayerData>> layers;
    Vector<InputSource> inputSources;

    FrameData copy() const;
};

class Device : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<Device> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(Device);
    WTF_MAKE_NONCOPYABLE(Device);
public:
    virtual ~Device() = default;

    using FeatureList = Vector<SessionFeature>;
    bool supports(SessionMode mode) const { return m_supportedFeaturesMap.contains(mode); }
    void setSupportedFeatures(SessionMode mode, const FeatureList& features) { m_supportedFeaturesMap.set(mode, features); }
    FeatureList supportedFeatures(SessionMode mode) const { return m_supportedFeaturesMap.get(mode); }
    void setEnabledFeatures(SessionMode mode, const FeatureList& features) { m_enabledFeaturesMap.set(mode, features); }
    FeatureList enabledFeatures(SessionMode mode) const { return m_enabledFeaturesMap.get(mode); }

    virtual WebCore::IntSize recommendedResolution(SessionMode) { return { 1, 1 }; }
    virtual double minimumNearClipPlane() const { return 0.1; }

    bool supportsOrientationTracking() const { return m_supportsOrientationTracking; }
    bool supportsViewportScaling() const { return m_supportsViewportScaling; }

    // Returns the value that the device's recommended resolution must be multiplied by
    // to yield the device's native framebuffer resolution.
    virtual double nativeFramebufferScalingFactor() const { return 1.0; }
    // Returns the value that the device's recommended resolution must be multiplied by
    // to yield the device's max framebuffer resolution. This resolution can be larger than
    // the native resolution if the device supports supersampling.
    virtual double maxFramebufferScalingFactor() const { return nativeFramebufferScalingFactor(); }

    virtual void initializeTrackingAndRendering(const WebCore::SecurityOriginData&, SessionMode, const FeatureList&) = 0;
    virtual void shutDownTrackingAndRendering() = 0;
    virtual void didCompleteShutdownTriggeredBySystem() { }
    TrackingAndRenderingClient* trackingAndRenderingClient() const { return m_trackingAndRenderingClient.get(); }
    void setTrackingAndRenderingClient(WeakPtr<TrackingAndRenderingClient>&& client) { m_trackingAndRenderingClient = WTFMove(client); }

    // If this method returns true, that means the device will notify TrackingAndRenderingClient
    // when the platform has completed all steps to shut down the XR session.
    virtual bool supportsSessionShutdownNotification() const { return false; }
    virtual void initializeReferenceSpace(ReferenceSpaceType) = 0;
    virtual std::optional<LayerHandle> createLayerProjection(uint32_t width, uint32_t height, bool alpha) = 0;
    virtual void deleteLayer(LayerHandle) = 0;

    struct LayerView {
        Eye eye { Eye::None };
        WebCore::IntRect viewport;
    };

    struct Layer {
        LayerHandle handle { 0 };
        bool visible { true };
        Vector<LayerView> views;
    };

    struct ViewData {
        bool active { false };
        Eye eye { Eye::None };
    };

    virtual Vector<ViewData> views(SessionMode) const = 0;

    using RequestFrameCallback = Function<void(FrameData&&)>;
    virtual void requestFrame(std::optional<RequestData>&&, RequestFrameCallback&&) = 0;
    virtual void submitFrame(Vector<Layer>&&) { };
protected:
    Device() = default;

    // https://immersive-web.github.io/webxr/#xr-device-concept
    // Each XR device has a list of enabled features for each XRSessionMode in its list of supported modes,
    // which is a list of feature descriptors which MUST be initially an empty list.
    using FeaturesPerModeMap = HashMap<SessionMode, FeatureList, IntHash<SessionMode>, WTF::StrongEnumHashTraits<SessionMode>>;
    FeaturesPerModeMap m_enabledFeaturesMap;
    FeaturesPerModeMap m_supportedFeaturesMap;

    bool m_supportsOrientationTracking { false };
    bool m_supportsViewportScaling { false };
    WeakPtr<TrackingAndRenderingClient> m_trackingAndRenderingClient;
};

class TrackingAndRenderingClient : public CanMakeWeakPtr<TrackingAndRenderingClient> {
public:
    virtual ~TrackingAndRenderingClient() = default;

    // This event is used to ensure that initial inputsourceschange events occur after the initial session is resolved.
    // WebxR apps can wait for the input source events before calling requestAnimationFrame.
    // Per-frame input source updates are handled via session.requestAnimationFrame which calls Device::requestFrame.
    virtual void sessionDidInitializeInputSources(Vector<FrameData::InputSource>&&) = 0;
    virtual void sessionDidEnd() = 0;
    virtual void updateSessionVisibilityState(VisibilityState) = 0;
    // FIXME: handle frame update
};

class Instance {
public:
    WEBCORE_EXPORT static Instance& singleton();

    using DeviceList = Vector<Ref<Device>>;
    WEBCORE_EXPORT void enumerateImmersiveXRDevices(CompletionHandler<void(const DeviceList&)>&&);

private:
    friend LazyNeverDestroyed<Instance>;
    Instance();
    ~Instance() = default;

    struct Impl;
    UniqueRef<Impl> m_impl;

    DeviceList m_immersiveXRDevices;
};

inline FrameData FrameData::copy() const
{
    PlatformXR::FrameData frameData;
    frameData.isTrackingValid = isTrackingValid;
    frameData.isPositionValid = isPositionValid;
    frameData.isPositionEmulated = isPositionEmulated;
    frameData.shouldRender = shouldRender;
    frameData.predictedDisplayTime = predictedDisplayTime;
    frameData.origin = origin;
    frameData.floorTransform = floorTransform;
    frameData.stageParameters = stageParameters;
    frameData.views = views;
    frameData.inputSources = inputSources;
    return frameData;
}

#endif // ENABLE(WEBXR)

} // namespace PlatformXR
