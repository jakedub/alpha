from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from app.serializers.user_serializer import UserSerializer
import json

User = get_user_model()


@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        identifier = data.get('email')
        password = data.get('password')

        print(f"Login attempt with identifier: {identifier}")
        print(f"Raw password received: {password}")  # ⚠️ DEBUG ONLY

        try:
            if '@' in identifier:
                user_obj = User.objects.get(email=identifier)
                print(f"User found by email: {user_obj.email}")
            else:
                user_obj = User.objects.get(username=identifier)
                print(f"User found by username: {user_obj.username}")
            print("Password check:", user_obj.check_password(password)) 
            user = authenticate(request, username=user_obj.username, password=password)
            print(f"Authentication result: {'Success' if user else 'Failed'}")
        except User.DoesNotExist:
            print("User lookup failed.")
            user = None

        if user is not None:
            login(request, user)
            print("Login successful.")
            return JsonResponse({'status': 'ok'})
        else:
            print("Login failed due to invalid credentials.")
            return JsonResponse({'error': 'Invalid credentials'}, status=400)


@csrf_exempt
def api_logout(request):
    logout(request)
    return JsonResponse({'status': 'logged out'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def api_me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)