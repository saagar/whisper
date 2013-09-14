from django.core.management.base import BaseCommand

from Crypto.PublicKey import RSA
from Crypto import Random

from keystore.models import PrivateKey, PublicKey

class Command(BaseCommand):

    def handle(self, *args, **options):
        rng = Random.new().read
        RSAkey = RSA.generate(1024, rng)
        if PrivateKey.objects.filter().count() > 0:
            PrivateKey.objects.filter()[0].delete()
        if PublicKey.objects.filter().count() > 0:
            PublicKey.objects.filter()[0].delete()
        key = PrivateKey(key=RSAkey.exportKey())
        pub_key = PublicKey(key=RSAkey.publickey().exportKey())
        key.save()
        pub_key.save()




