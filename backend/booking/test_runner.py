from django.test.runner import DiscoverRunner
from django.db import connection
from django.apps import apps


class ManagedModelTestRunner(DiscoverRunner):
    """
    Custom test runner that dynamically enables 'managed = True' for all
    unmanaged models in the 'booking' app during test database setup and execution.
    """

    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        for model in apps.get_models():
            if model._meta.app_label == 'booking':
                model._meta.managed = True

    def teardown_test_environment(self, **kwargs):
        for model in apps.get_models():
            if model._meta.app_label == 'booking':
                model._meta.managed = False
        super().teardown_test_environment(**kwargs)

    def setup_databases(self, **kwargs):
        # Temporarily enable managed = True before creating tables
        for model in apps.get_models():
            if model._meta.app_label == 'booking':
                model._meta.managed = True

        old_config = super().setup_databases(**kwargs)

        # Explicitly create tables if they were not created by migrations
        models_in_order = [
            apps.get_model('booking', 'User'),
            apps.get_model('booking', 'TurfGround'),
            apps.get_model('booking', 'TurfImage'),
            apps.get_model('booking', 'AuthToken'),
            apps.get_model('booking', 'Booking'),
            apps.get_model('booking', 'Payment'),
        ]

        with connection.schema_editor() as schema_editor:
            for model in models_in_order:
                try:
                    schema_editor.create_model(model)
                except Exception:
                    # Table may already exist
                    pass

        return old_config
