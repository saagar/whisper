import random

from Crypto.PublicKey import RSA

from django.utils.hashcompat import sha_constructor
from django.db import models
from django.core.mail import send_mail
from django.core.urlresolvers import reverse
from django.conf import settings

from django.contrib.auth.models import AbstractUser

class WhisperUser(AbstractUser):
    public_key = models.TextField(blank=True, null=True)
    friends = models.ManyToManyField('self', blank=True, null=True)
    signed_key = models.TextField(blank=True, null=True)
    verification_code = models.CharField(max_length=256, blank=True, null=True)
    verified = models.BooleanField(default=False)

    def generate_verification_code(self):
        salt = sha_constructor(str(random.random())).hexdigest()[:5]
        ck = sha_constructor(salt + self.email).hexdigest()
        return ck

    def send_email_verify(self):
        # Send the verification email
        link = settings.BASE_URL + reverse('keystore.views.email_verify', args=(self.verification_code, ))
        send_mail('Verify Your Email', link, 'server@signalfirewhisper.com',
            [self.email], fail_silently=True)

    def sign_public_key(self):
        server_private_key = PrivateKey.objects.filter()[0].key
        server_private_key_object = RSA.importKey(server_private_key)
        signed_key = server_private_key_object.sign(str(self.public_key), 1024)
        self.signed_key = signed_key
        self.save()

class PrivateKey(models.Model):
    key = models.TextField(blank=False, null=False)

class PublicKey(models.Model):
    key = models.TextField(blank=False, null=False)
