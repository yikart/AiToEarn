/*
 * Copyright (C) 2014 Igalia S.L
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

#ifndef WKUserMediaPermissionRequest_h
#define WKUserMediaPermissionRequest_h

#include <WebKit/WKBase.h>

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT WKTypeID WKUserMediaPermissionRequestGetTypeID(void);

enum {
    kWKNoConstraints = 0,
    kWKUserMediaDisabled,
    kWKNoCaptureDevices,
    kWKInvalidConstraint,
    kWKHardwareError,
    kWKPermissionDenied,
    kWKOtherFailure
};
typedef uint32_t UserMediaPermissionRequestDenialReason;

WK_EXPORT void WKUserMediaPermissionRequestAllow(WKUserMediaPermissionRequestRef, WKStringRef audioDeviceUID, WKStringRef videoDeviceUID);
WK_EXPORT void WKUserMediaPermissionRequestDeny(WKUserMediaPermissionRequestRef, UserMediaPermissionRequestDenialReason);

WK_EXPORT bool WKUserMediaPermissionRequestRequiresCameraCapture(WKUserMediaPermissionRequestRef);
WK_EXPORT bool WKUserMediaPermissionRequestRequiresDisplayCapture(WKUserMediaPermissionRequestRef);
WK_EXPORT bool WKUserMediaPermissionRequestRequiresMicrophoneCapture(WKUserMediaPermissionRequestRef);
WK_EXPORT WKArrayRef WKUserMediaPermissionRequestVideoDeviceUIDs(WKUserMediaPermissionRequestRef);
WK_EXPORT WKArrayRef WKUserMediaPermissionRequestAudioDeviceUIDs(WKUserMediaPermissionRequestRef);

#ifdef __cplusplus
}
#endif

#endif /* WKUserMediaPermissionRequest_h */
