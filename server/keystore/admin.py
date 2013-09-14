from django.contrib import admin

from .models import WhisperUser


class WhisperUserAdmin(admin.ModelAdmin):
    pass

admin.site.register(WhisperUser, WhisperUserAdmin)
