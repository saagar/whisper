import json

from django.http import HttpResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render_to_response
from django.shortcuts import redirect

from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required, user_passes_test

from Crypto.PublicKey import RSA

from .models import WhisperUser, PublicKey
from .forms import UserForm, FriendForm

@csrf_exempt
def create_user(request):
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():
            form.save()
            user = authenticate(username=request.POST.get("username"), password=request.POST.get("password2"))
            login(request, user)
            response = HttpResponse("Success")
        else:
            response = HttpResponse("Failed")
        return response
    else:
        form = UserForm()
        return render_to_response('register.html', {"form": form})

@user_passes_test(lambda u: u.verified)
@login_required
def get_key(request, username):
    if username in map(lambda x: x.username, request.user.friends.all()):
        signed_key = WhisperUser.objects.get(username=username).signed_key
        server_public_key = PublicKey.objects.filter()[0].key

        response_data = {"success": True, "username": username, "key": signed_key,
                         "server_key": server_public_key}
    else:
        response_data = {"success": False}
    return HttpResponse(json.dumps(response_data), content_type="application/json")

@user_passes_test(lambda u: u.verified)
@login_required
@csrf_exempt
def get_friends(request):
    if request.user.is_authenticated():
        friends = map(lambda x: x.username, request.user.friends.all())
        response_data = {"username": request.user.username, "friends": friends}
        return HttpResponse(json.dumps(response_data), content_type="application/json")
    else:
        return HttpResponseForbidden()

@user_passes_test(lambda u: u.verified)
@login_required
@csrf_exempt
def add_friend(request):
    if request.method == 'POST':
        form = FriendForm(request.POST)
        if form.is_valid():
            user = request.user
            friend = WhisperUser.objects.get(username=form.cleaned_data['username'])
            user.friends.add(friend)
            user.save()
        response = HttpResponse("success")
    else:
        response = render_to_response('friends.html', {"friends": list(request.user.friends.all())})
    return response

def login_user(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                # Redirect to a success page.
                response = redirect('/keystore/user/friends/add/')
            else:
                # Return a 'disabled account' error message
                response = HttpResponse("Failed")
        else:
            # Return an 'invalid login' error message.
            response = HttpResponse("Failed")
        return response
    else:
        if request.user.is_authenticated():
            return redirect('/keystore/user/friends/add/')
        return render_to_response('login.html')

@user_passes_test(lambda u: u.verified)
def get_public_key(request):
    return HttpResponse(json.dumps(PublicKey.objects.filter()[0].key), content_type="application/json")

def current_user(request):
    username = None
    if request.user.is_authenticated():
        username = request.user.username
    response = {"user": username}
    return HttpResponse(json.dumps(response), content_type="application/json")

def email_verify(request, code):
    user = None
    try:
        user = WhisperUser.objects.get(verification_code=code)
    except:
        return HttpResponseForbidden()
    if user:
        user.verified = True
        user.sign_public_key()
        user.save()
        return HttpResponse("Success")
    return HttpResponse("Failed")
