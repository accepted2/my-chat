from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
import random
import time
import json
from .models import RoomMember
from django.views.decorators.csrf import csrf_exempt


def GetToken(request):
    appId = "356e6d0957a4433f928ed983929e30bb"
    appCertificate = "34c363b8fbb3463e9ca605ff104fdac6"
    channelName = request.GET.get("channel")
    uid = random.randint(1, 230)
    expirationTimeInSeconds = 3600 * 24
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    role = 1
    token = RtcTokenBuilder.buildTokenWithUid(
        appId, appCertificate, channelName, uid, role, privilegeExpiredTs
    )
    return JsonResponse({"token": token, "uid": uid})


# Create your views here.
def lobby(request):

    return render(request, "base/lobby.html")


def room(request):
    return render(request, "base/room.html")


@csrf_exempt
def createMember(request):
    data = json.loads(request.body)

    member, created = RoomMember.objects.get_or_create(
        name=data["name"],
        uid=data["UID"],
        room_name=data["room_name"],
    )
    return JsonResponse({"name": data["name"]}, safe=False)


def getMember(request):
    uid = request.GET.get("UID")
    room_name = request.GET.get("room_name")

    member = RoomMember.objects.get(uid=uid, room_name=room_name)
    name = member.name
    return JsonResponse({"name": member.name}, safe=False)


@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)

    member = RoomMember.objects.get(
        uid=data["UID"], name=data["name"], room_name=data["room_name"]
    )
    member.delete()
    return JsonResponse("Memeber was deleted", safe=False)
