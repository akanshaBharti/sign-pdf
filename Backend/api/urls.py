from django.urls import path

from .views import sign_pdf

urlpatterns = [
    path("sign-pdf/", sign_pdf, name="sign_pdf"),
]
