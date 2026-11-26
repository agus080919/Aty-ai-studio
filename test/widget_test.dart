import 'package:flutter_test/flutter_test.dart';
import 'package:aty_ai_studio/main.dart';

void main() {
  testWidgets('ATY AI STUDIO opens', (tester) async {
    await tester.pumpWidget(const AtyApp());

    expect(find.text('ATY AI STUDIO'), findsOneWidget);
  });
}
