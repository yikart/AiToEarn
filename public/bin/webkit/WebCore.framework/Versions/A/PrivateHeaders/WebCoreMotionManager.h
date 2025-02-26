/*
 * Copyright (C) 2010 Apple Inc. All Rights Reserved.
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

#if PLATFORM(IOS_FAMILY) && ENABLE(DEVICE_ORIENTATION)

#import <CoreLocation/CoreLocation.h>
#import <wtf/RetainPtr.h>
#import <wtf/WeakHashSet.h>

constexpr float kMotionUpdateInterval = 1.0f / 60.0f;
@class CMMotionManager;

namespace WebCore {
class DeviceMotionClientIOS;
class MotionManagerClient;
}

WEBCORE_EXPORT @interface WebCoreMotionManager : NSObject {
    RetainPtr<CMMotionManager> m_motionManager;
    RetainPtr<CLLocationManager> m_locationManager;
    WeakHashSet<WebCore::MotionManagerClient> m_deviceMotionClients;
    WeakHashSet<WebCore::MotionManagerClient> m_deviceOrientationClients;
    RetainPtr<NSTimer> m_updateTimer;
    BOOL m_gyroAvailable;
    BOOL m_headingAvailable;
    BOOL m_initialized;
}

+ (WebCoreMotionManager *)sharedManager;
- (void)addMotionClient:(WebCore::MotionManagerClient *)client;
- (void)removeMotionClient:(WebCore::MotionManagerClient *)client;
- (void)addOrientationClient:(WebCore::MotionManagerClient *)client;
- (void)removeOrientationClient:(WebCore::MotionManagerClient *)client;
- (BOOL)gyroAvailable;
- (BOOL)headingAvailable;
@end

#endif // PLATFORM(IOS_FAMILY) && ENABLE(DEVICE_ORIENTATION)
